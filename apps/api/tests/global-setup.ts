import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";

export default function globalSetup() {
  const envPath = path.resolve(__dirname, "../.env.test");
  const parsed = config({ path: envPath }).parsed ?? {};

  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, ...parsed },
  });
}
