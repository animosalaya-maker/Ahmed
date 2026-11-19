import { defineConfig } from "vite";
export default defineConfig({
  server: { port: 5173 },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: "index.html", characters: "characters.html" } },
  },
});
