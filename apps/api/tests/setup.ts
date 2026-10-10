import path from "path";
import { config } from "dotenv";

// Loaded before any test file's imports, so config/env.ts (imported transitively via app.ts
// or any service) sees the test DB/secrets instead of dev's.
config({ path: path.resolve(__dirname, "../.env.test"), override: true });
