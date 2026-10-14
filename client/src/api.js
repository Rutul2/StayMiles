import axios from "axios";

// One axios instance for the whole app. Every URL starts with /api.
const api = axios.create({ baseURL: "/api" });

// Runs before EVERY request: if we have a JWT, attach it as "Authorization: Bearer <token>".
// This is why individual components never have to think about the token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Pulls the server's { message } out of an error so we can show it to the user
export const getErrorMessage = (err) =>
  err.response?.data?.message || "Something went wrong. Please try again.";

export default api;
