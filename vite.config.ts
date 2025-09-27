import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
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
    electron([
      {
        entry: "electron/main.ts",
        onstart(options: { startup: () => void }) {
          if (options.startup) {
            options.startup();
          }
        },
        vite: {
          build: {
            sourcemap: false,
            minify: true,
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
        onstart(options: { reload: () => void }) {
          options.reload();
        },
        vite: {
          build: {
            sourcemap: false,
            minify: true,
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
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@electron": resolve(__dirname, "./electron"),
    },
  },
  base: "./",
  build: {
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    projects: [
      // Renderer tests (React/DOM)
      {
        define: {
          __APP_VERSION__: JSON.stringify(pkg.version),
        },
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
