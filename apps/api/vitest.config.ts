import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 20000,
    fileParallelism: false, // tests share one DB; truncation between files must not race
  },
});
