# StayMiles

An accommodation platform where guests can explore stays and make smarter booking decisions using three data-driven features:

| Feature | What it does | Powered by |
|---|---|---|
| **Nearby insights** | Shows the closest grocery stores, medical places, food places and transport stops, with distance | Overpass API (OpenStreetMap) |
| **Review summary** | Summarises guest reviews: what guests love, complaints, who it's best for | Google Gemini |
| **Safety score** | Pulls safety keywords out of reviews and scores the stay from 1 to 10 | Google Gemini |

**Stack:** React.js · Node.js · Express 5 · MongoDB (Mongoose) · JWT authentication · Cloudinary · Joi

## Project structure

```
StayMiles/
├── app.js                  Express server entry point
├── routes/                 URL -> controller mapping (user, listing, review)
├── controller/             Request handling (user, listing, review, insights)
├── models/                 Mongoose schemas (User, Listing, Review)
├── middleware.js           isLoggedIn (JWT), isOwner, isReviewAuthor, validate
├── schema.js               Joi validation rules
├── utils/
│   ├── nearBy.js           Overpass API: top-K nearby places
│   ├── aiSummary.js        Gemini: review summary
│   ├── safetyScore.js      Gemini: safety keywords + score (keyword-rule fallback)
│   ├── gemini.js           Shared Gemini helper
│   └── geocode.js          Address -> coordinates (Nominatim)
├── cloudConfig.js          Cloudinary + multer upload
├── init/                   Seed data
└── client/                 React app
    └── src/
        ├── pages/          Home, ListingDetail, ListingForm, AuthPage
        ├── components/     Navbar, ListingCard, NearbyInsights, ReviewSummary,
        │                   SafetyScore, Reviews, PriceBreakdown, StarRating, ProtectedRoute
        ├── context/        AuthContext (login state)
        ├── hooks/          useFetch (data loading)
        ├── api.js          axios instance that attaches the JWT
        └── index.css       All styles, with colours defined as variables at the top
```

## Run locally


```bash
# 1. Backend
npm install
cp .env.example .env        # then fill in the values
npm run dev                 # http://localhost:8080

# 2. Frontend (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to port 8080)
```

`npm run seed` fills a **local** MongoDB with sample listings and a demo host
(`demohost@example.com` / `demo1234`).

### Environment variables

| Name | Purpose |
|---|---|
| `ATLASDB_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens. |
| `CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads |
| `GEMINI_API_KEY` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |


## API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create account, returns `{ token, user }` |
| POST | `/api/auth/login` | – | Log in, returns `{ token, user }` |
| GET | `/api/auth/me` | JWT | Current user (used to restore a session) |
| GET | `/api/listings?search=` | – | List/search listings |
| GET | `/api/listings/:id` | – | One listing with reviews |
| POST | `/api/listings` | JWT | Create (multipart with `image`) |
| PUT | `/api/listings/:id` | JWT + owner | Update |
| DELETE | `/api/listings/:id` | JWT + owner | Delete (also deletes its reviews) |
| GET | `/api/listings/:id/nearby?k=3&radius=2000` | – | Top-K nearby places per category |
| GET | `/api/listings/:id/summary` | – | Gemini review summary |
| GET | `/api/listings/:id/safety` | – | Gemini safety keywords + score |
| POST | `/api/listings/:id/reviews` | JWT | Add a review |
| DELETE | `/api/listings/:id/reviews/:reviewId` | JWT + author | Delete a review |

Authenticated requests send `Authorization: Bearer <token>`.
