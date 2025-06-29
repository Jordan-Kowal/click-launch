import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import million from "million/compiler";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig(({ mode }) => ({
  plugins: [
    million.vite({ auto: true }),
    react(),
    electron([
      {
        entry: "electron/main.ts",
        onstart(options) {
          if (options.startup) {
            options.startup();
          }
        },
        vite: {
          build: {
            sourcemap: true,
            minify: false,
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"],
              output: {
                format: "cjs",
                entryFileNames: "[name].js",
              },
            },
          },
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            sourcemap: "inline",
            minify: false,
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"],
              output: {
                format: "cjs",
                entryFileNames: "[name].js",
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  server: {
    port: 5173,
  },
  esbuild: {
    loader: "tsx",
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".ts": "tsx",
      },
    },
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    setupFiles: ["src/tests/setup.ts"],
    environment: "jsdom",
    coverage: {
      exclude: [
        // Builds
        "dist/**",
        "dist-electron/**",
        // Configs
        "vite.config.ts",
        "postcss.config.js",
        "tailwind.config.js",
        // Types
        "src/types/**",
        "src/api/types.ts",
        // Special cases
        "src/App.tsx",
        "src/main.tsx",
        "electron/**",
        "src/tests/**",
      ],
      all: true,
      thresholds: {
        perFile: false,
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    css: true,
    isolate: true,
    retry: 1,
  },
}));
