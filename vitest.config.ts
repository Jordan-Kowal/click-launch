import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify("test-version"),
  },
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
      "@backend": `${import.meta.dirname}/frontend/bindings/github.com/Jordan-Kowal/click-launch/backend`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
