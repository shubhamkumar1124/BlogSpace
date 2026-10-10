import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local dev: /api calls go to the Express server, so the browser sees one
    // origin and the login cookie works without any CORS tricks.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
