import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  optimizeDeps: {
    include: [
      "prismjs",
      "prismjs/components/prism-python",
      "prismjs/components/prism-c",
      "prismjs/components/prism-cpp",
      "prismjs/components/prism-sql",
      "prismjs/components/prism-bash",
      "prismjs/components/prism-css",
      "prismjs/components/prism-markup",
      "prismjs/components/prism-rust",
      "prismjs/components/prism-go",
      "prismjs/components/prism-kotlin",
      "prismjs/components/prism-typescript",
      "prismjs/components/prism-nasm",
    ],
  },
  build: {
    outDir: "dist/mobile",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.mobile.html"),
    },
  },
  root: ".",
});
