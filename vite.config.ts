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
    alias: {
      "@": resolve(__dirname, "./src"),
      "@electron": resolve(__dirname, "./electron"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    projects: [
      // Renderer tests (React/DOM)
      {
        test: {
          name: "renderer",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["src/tests/setup.ts"],
        },
        resolve: {
          alias: {
            "@": resolve(__dirname, "./src"),
            "@electron": resolve(__dirname, "./electron"),
          },
        },
      },
      // Electron tests (Node.js)eg
      {
        test: {
          name: "electron",
          environment: "node",
          include: ["electron/**/*.test.ts"],
        },
        resolve: {
          alias: {
            "@": resolve(__dirname, "./src"),
            "@electron": resolve(__dirname, "./electron"),
          },
        },
      },
    ],
    coverage: {
      all: true,
      thresholds: {
        perFile: false,
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        // Configs
        "postcss.config.js",
        "tailwind.config.js",
        "vite.config.ts",
        "src/types",
        // Test files
        "src/tests/**/*",
        "src/**/*.test.{ts,tsx}",
        "electron/**/*.test.ts",
        // Custom exclude files
        "src/App.tsx",
        "src/main.tsx",
        "electron/preload.ts",
        "electron/main.ts",
      ],
    },
    css: true,
    isolate: true,
    retry: 1,
  },
}));
