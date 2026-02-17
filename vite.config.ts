import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import pkg from "./package.json";

export default defineConfig(() => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    devtools(),
    solidPlugin(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@backend": resolve(__dirname, "./frontend/bindings/github.com/Jordan-Kowal/click-launch/backend"),
    },
  },
  base: "./",
  build: {
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          "solid-vendor": ["solid-js", "@solidjs/router"],
          "ui-vendor": ["lucide-solid", "solid-toast"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "solid-js",
      "@solidjs/router",
      "lucide-solid",
      "solid-toast",
      "js-yaml",
    ],
  },
}));
