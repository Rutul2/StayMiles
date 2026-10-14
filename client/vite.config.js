import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // In development, requests to /api are forwarded to the Express server.
    // The browser thinks everything is one site, so we don't need CORS.
    proxy: { "/api": "http://localhost:8080" },
  },
});
