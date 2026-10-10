import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1, // specs share the real dev database (no per-test isolation) - run strictly sequentially
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    channel: "msedge", // use the system Edge install - avoids downloading Playwright's own Chromium
  },
  projects: [{ name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } }],
  webServer: [
    {
      command: "npm run dev:api",
      url: "http://localhost:5000/api/health",
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "npm run dev:web",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
