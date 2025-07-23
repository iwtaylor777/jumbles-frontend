// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),     // your existing React plugin
    tailwind(),  // <-- the Tailwind v4 Vite plugin
  ],
});