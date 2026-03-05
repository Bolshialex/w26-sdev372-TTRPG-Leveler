import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  // ADD THIS SECTION BELOW:
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test/setup.js", // Make sure this path matches where you put the file
  },
});
