import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
<<<<<<< HEAD
      "/api": {
        target: "http://localhost:80",
=======
      '/api': {
        target: 'http://127.0.0.1:3000',
>>>>>>> f8382f4156b40af769d831a602a5e4d0c736851f
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
