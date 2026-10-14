# StayMiles: Interview Guide

Read this once, then open the code next to it. Every answer below points to a real file.

## 1. The 30-second pitch

> StayMiles is a full-stack accommodation platform. Besides normal listings, reviews and
> authentication, I built three features that help a guest decide. **Nearby insights** uses the
> Overpass API to find the closest groceries, medical places, food and transport. **Review
> summary** uses Gemini to condense reviews. **Safety score** uses Gemini to extract safety
> keywords from reviews and score them. The frontend is React, the backend is Express and
> MongoDB, and login uses JWT.

## 2. How the pieces connect

```
 Browser (React)                         Server (Express)                      External
 ───────────────                         ────────────────                      ────────
 pages/components   ── axios /api ──►   routes ► middleware ► controller ──►  MongoDB
 AuthContext stores                      (isLoggedIn checks JWT)         ├──►  Overpass API
 the token and axios                                                     ├──►  Nominatim (geocoding)
 sends it every time                                                     ├──►  Google Gemini
                                                                         └──►  Cloudinary
```

**What happens when someone opens a listing page** (`pages/ListingDetail.jsx`):
1. React Router matches `/listings/:id`; the component reads `id` with `useParams`.
2. `useFetch` calls `GET /api/listings/:id` and shows the listing.
3. Three child components each fetch on their own: `NearbyInsights`, `ReviewSummary`, `SafetyScore`.
   They load independently, so a slow Gemini call never blocks the page.

## 3. Feature 1: Nearby insights (Overpass API)

Files: `utils/nearBy.js`, `controller/insights.js`, `client/src/components/NearbyInsights.jsx`

**Flow**
1. The listing has an address ("Surat, India"). `utils/geocode.js` converts it to latitude/longitude
   using Nominatim, **once**, and saves it on the listing so we never geocode it again.
2. `buildQuery` makes one Overpass query: "everything tagged supermarket / pharmacy / restaurant /
   bus stop… within 2000 m of this point". One request covers all four categories.
3. For each result we compute the straight-line distance with the **haversine formula**.
4. Results are grouped by category, **sorted by distance, and cut to the top K**
   (`k` comes from the query string, default 3).
5. React shows tabs per category and a "Show top 3/5/10" dropdown. Changing it re-fetches with a new `k`.

**Questions you might get**
- *Why Overpass instead of Google Places?* It is free and open (OpenStreetMap data), no billing setup.
  Trade-off: coverage depends on volunteers, so some areas have fewer entries.
- *What is the haversine formula?* Distance between two points on a sphere. Needed because latitude and
  longitude are angles, so Pythagoras on raw numbers gives wrong distances.
- *What is "top K"?* Keep only the K nearest. It is a sort plus `slice(0, k)`. For a few hundred results
  that is fast; for millions you would use a geospatial index (MongoDB `2dsphere`).
- *What if the API is down?* There are two Overpass servers; if the first fails we try the second.
  If both fail the endpoint returns a 502 and the UI shows "Try again". We do not show fake data.
- *How do you avoid hammering a free public API?* Results are cached in memory for one hour, keyed by
  coordinates and radius.
- *Why `out center` and `nwr`?* Shops are sometimes mapped as building outlines (ways), not single
  points. `nwr` searches nodes, ways and relations; `out center` gives a point for outlines.

## 4. Feature 2: Review summary (Gemini)

Files: `utils/aiSummary.js`, `utils/gemini.js`, `client/src/components/ReviewSummary.jsx`

**Flow**
1. Controller loads the listing's reviews. Fewer than 3 reviews: no summary (not meaningful).
2. `reviewsToText` turns reviews into a numbered list (newest 60, each cut to 400 characters).
3. The prompt asks Gemini for JSON in a fixed shape: `summary`, `guestsLove`, `complaints`, `bestFor`.
   `responseMimeType: "application/json"` forces valid JSON, so we can `JSON.parse` safely.
4. The average rating is computed in **our code**, not by the AI. Numbers should come from data.
5. The result is saved on the listing (`aiSummary`) and reused. When a review is added or deleted, the
   cache is cleared (`controller/review.js`), so Gemini is called only when reviews actually change.

**Questions you might get**
- *Why a separate endpoint instead of computing it in the listing route?* An AI call takes seconds.
  A separate endpoint keeps the main page fast and lets the card show its own loading state.
- *How do you handle Gemini failing?* `try/catch` returns a fallback message with the real average
  rating, and the card says the AI summary is unavailable. The failure is **not cached**, so the next
  visit tries again.
- *Can AI make things up (hallucinate)?* Yes. The prompt says "use only what the reviews say", the
  temperature is low (0.2), and the card is labelled as AI-generated.
- *Can a malicious review attack the prompt (prompt injection)?* The prompt tells the model to treat
  reviews as data and ignore instructions in them. That reduces the risk but does not remove it, which
  is why the output is only displayed as text, never executed.
- *Why cache?* Cost, speed and rate limits. Same reviews give the same summary.

## 5. Feature 3: Safety score (Gemini)

Files: `utils/safetyScore.js`, `client/src/components/SafetyScore.jsx`

**Flow**
1. Same review text goes to Gemini with two jobs: (a) **extract safety keywords** ("well lit",
   "security guard", "theft") and split them into positive and negative, (b) give a 1 to 10 score
   based only on those keywords.
2. We **validate** the answer: keywords are cleaned and de-duplicated, the score is clamped to 1 to 10
   and rounded. If Gemini returns an invalid score we treat it as a failure.
3. The label and colour (Safe, Mixed feedback, Safety concerns) are decided by **our code** from the
   score (7+ and 4+ thresholds in `describe()`), not by the AI, so they are consistent.
4. If reviews never mention safety, Gemini returns no keywords and the UI says so, rather than
   inventing a score.
5. **Fallback:** if Gemini fails, a rule-based scorer counts words from a keyword list. The card shows
   "Scored by keyword matching" so the user knows which method produced the number.

**Questions you might get**
- *Why ask for keywords first?* It makes the score explainable. The user sees *why* it is 7.5.
- *Why a fallback if you have AI?* APIs fail and free quotas run out. A degraded but honest result
  beats an error page.
- *How does the rule-based fallback handle "not safe"?* It removes negative phrases first, so "not safe"
  is not counted as the positive word "safe".
- *Is this score reliable?* Be honest: it reflects what a few reviewers wrote, not official crime data.
  It is a helpful signal, not a guarantee, and the UI says what it is based on.

## 6. Authentication: JWT

Files: `controller/user.js`, `middleware.js`, `client/src/context/AuthContext.jsx`, `client/src/api.js`

**Flow**
1. **Signup:** Joi validates input, the password is hashed with **bcrypt**, the user is saved, and the
   server returns a signed **token** plus the user.
2. **Login:** find the user by email, `bcrypt.compare`, return a token. The error message is the same
   for "no such email" and "wrong password", so attackers cannot discover which emails exist.
3. **Token:** a JWT contains the user id and an expiry (7 days), signed with `JWT_SECRET`. Anyone can
   *read* it, but nobody can *change* it without the secret.
4. **Client:** `AuthContext` saves the token in `localStorage`. An axios interceptor attaches
   `Authorization: Bearer <token>` to every request.
5. **Server:** `isLoggedIn` verifies the signature and expiry, loads the user, and sets `req.user`.
   `isOwner` and `isReviewAuthor` then check ownership.
6. **Page refresh:** React calls `GET /api/auth/me` with the saved token to restore the user.
7. **Logout:** delete the token. There is no server session to destroy.

**Questions you might get**
- *Why JWT instead of sessions (Passport)?* Sessions store state on the server and need a session store
  to scale. JWT is stateless: the token carries the identity. It also suits a separate React frontend
  and mobile apps.
- *JWT downsides?* A token cannot be revoked before it expires unless you keep a blocklist. I used a
  7-day expiry. A refresh-token flow would be the next step.
- *Is localStorage safe?* It is readable by JavaScript, so an XSS bug could steal the token. React
  escapes output by default, which helps. The more secure alternative is an `httpOnly` cookie (needs
  CSRF protection). I chose the header approach for simplicity and I know the trade-off.
- *Why bcrypt?* It is deliberately slow and adds a random salt, so stolen hashes are expensive to crack.
  Never store plain passwords or use fast hashes like MD5.
- *What is in a JWT?* Three Base64 parts: header, payload, signature. Try pasting one into jwt.io.
- *Authentication vs authorization?* Authentication = who you are (`isLoggedIn`). Authorization = what you
  may do (`isOwner`). Hiding the Delete button in React is only cosmetic; the **server** enforces it.

## 7. Frontend questions (React)

**Where each concept is used in this project**

| Concept | Where | Plain-English explanation |
|---|---|---|
| `useState` | everywhere (`NearbyInsights` tab and k, forms) | Memory for a component. Changing it re-renders |
| `useEffect` | `useFetch.js`, `AuthContext.jsx` | Run code after render, e.g. fetch data. Re-runs when its dependency list changes |
| Custom hook | `hooks/useFetch.js` | Reusable logic. One hook replaces the same fetch code in 5 components |
| Context | `context/AuthContext.jsx` | Share the logged-in user without passing props through every level |
| Router | `App.jsx` | Maps URLs to pages without reloading the browser (single-page app) |
| `useParams` / `useSearchParams` | `ListingDetail`, `Home` | Read `:id` from the path and `?search=` from the URL |
| Protected route | `components/ProtectedRoute.jsx` | Wraps a page; redirects to `/login` if there is no user |
| Controlled inputs | `AuthPage`, `ListingForm`, `Reviews` | Input value lives in state, so React is the single source of truth |
| Props | `ListingCard`, `PriceBreakdown` | Data passed from parent to child. Read-only for the child |
| Lists and `key` | `Home` grid, review list | `key` helps React track which item is which |
| Conditional rendering | loading / error / empty states | `{loading && ...}`, `{error && ...}` |
| `FormData` | `ListingForm` | Required to upload a file; JSON cannot carry files |

**Likely questions**
- *Why React over EJS?* EJS renders full pages on the server, so every action reloads the page. React
  updates only the parts that change, makes the three AI cards load independently, and keeps the UI
  in reusable components. The server became a clean JSON API.
- *What is the Virtual DOM?* React keeps a lightweight copy of the UI in memory, compares old and new,
  and updates only what changed in the real DOM.
- *State vs props?* State is owned and changed by the component itself. Props are given by the parent.
- *Why does `useEffect` have `[url, paramsKey, tick]`?* Those are the values the effect depends on.
  When any changes, it runs again. That is how changing "Show top 5" fetches new data.
- *What is the `ignore` variable in `useFetch`?* If the user navigates away before a response arrives,
  we ignore that late response so it cannot update the wrong page (a race condition).
- *How do the AI cards refresh after a new review?* `ListingDetail` changes the `key` on them. A new key
  makes React rebuild the component, which fetches again.
- *How is the price breakdown calculated?* A small pure function in `utils/pricing.js` (nights x price,
  plus 18% GST, plus a flat fee). It lives in the browser because there is no booking yet. In a real
  booking flow the server would recompute it, because browser values can be tampered with.
- *How does the dev setup avoid CORS?* Vite proxies `/api` to Express, so the browser sees one origin.
  In production Express serves the built React files, so it is one origin as well.
- *How is it responsive?* CSS grid with `auto-fill`, and one `@media` block for small screens.
- *Accessibility basics you did?* Labels on inputs, visible focus outlines, `aria-label` on star buttons,
  `role="alert"` on form errors, meaningful alt text.
- *How would you test it?* Unit-test `calculatePrice` and the backend helpers, and use React Testing
  Library for components. (I tested the flows manually and with a browser script.)

## 8. Backend questions

- *Explain MVC here.* Models (`models/`) describe data, controllers (`controller/`) hold logic, and
  routes (`routes/`) connect URLs to controllers. The "view" is now the React app consuming JSON.
- *What is middleware?* A function that runs between request and response: `isLoggedIn`, `validate`,
  multer's `upload`. Order matters: `isLoggedIn, isOwner, upload, validate, controller`.
- *Why does the route order put `isOwner` before `upload`?* So an unauthorised user can't upload files.
- *Why Joi?* Never trust client input. Joi checks shape and types before anything reaches MongoDB.
- *How do uploads work?* The browser sends `multipart/form-data`. Multer streams the file to Cloudinary
  and gives us the URL in `req.file`, which we store on the listing.
- *What does `populate` do?* Listings store review ids. `populate` swaps ids for the real documents,
  like a join.
- *Why no `wrapAsync` any more?* Express 5 forwards errors from async handlers to the error handler
  automatically.
- *Where are errors handled?* One central handler in `app.js`. Controllers `throw new ExpressError(status, message)`.
- *What happens when a listing is deleted?* A Mongoose hook (`findOneAndDelete`) deletes its reviews,
  and the controller deletes the Cloudinary image.
- *How do you keep secrets safe?* They live in `.env` (git-ignored) and are never logged.
  The old version printed keys to the console. That was removed.

## 9. Say these limitations before they ask

Pointing out your own limits shows maturity.

- Nearby results depend on OpenStreetMap coverage and public API rate limits. At scale I would
  self-host Overpass or use a paid places API, and use a shared cache (Redis) instead of memory.
- The nearby cache is in memory, so it resets when the server restarts.
- The safety score is based only on review text, so it is a signal, not a guarantee.
- JWT in `localStorage` has the XSS trade-off described above. Refresh tokens would be a next step.
- There is no booking or payment flow yet, so the price breakdown is informational.
- No automated test suite yet. I would start with the pricing function, the safety fallback scorer
  and the auth middleware.

## 10. If asked "what would you improve next?"

1. Automated tests (Jest + React Testing Library).
2. Show the listing on a map (Leaflet), with the nearby places as pins.
3. Rate limiting on auth and AI endpoints.
4. Refresh tokens and `httpOnly` cookies.
5. Pagination for the listings page.
