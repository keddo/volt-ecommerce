import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { truncateAll, createTestUser } from "../helpers/db";

beforeEach(async () => {
  await truncateAll();
});

describe("POST /api/auth/register", () => {
  it("creates a CUSTOMER account and returns a usable session", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "New Customer",
      email: "newcustomer@example.com",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("CUSTOMER");
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects a duplicate email with 409", async () => {
    await createTestUser();
    const existingEmail = (await createTestUser()).email;

    const res = await request(app).post("/api/auth/register").send({
      name: "Dup",
      email: existingEmail,
      password: "SecurePass123!",
    });

    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const { email, password } = await createTestUser({ password: "CorrectHorse1!" });
    const res = await request(app).post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects an incorrect password with 401", async () => {
    const { email } = await createTestUser({ password: "CorrectHorse1!" });
    const res = await request(app).post("/api/auth/login").send({ email, password: "WrongPassword" });
    expect(res.status).toBe(401);
  });
});

function extractCookie(res: request.Response, name: string): string {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  const match = raw?.find((c) => c.startsWith(`${name}=`));
  if (!match) throw new Error(`Expected a ${name} cookie in the response`);
  return match.split(";")[0];
}

describe("refresh token rotation", () => {
  it("rotates on refresh and revokes the previous token (can't be replayed)", async () => {
    const { email, password } = await createTestUser({ password: "CorrectHorse1!" });

    const loginRes = await request(app).post("/api/auth/login").send({ email, password });
    const originalCookie = extractCookie(loginRes, "refreshToken");

    const firstRefresh = await request(app).post("/api/auth/refresh").set("Cookie", originalCookie);
    expect(firstRefresh.status).toBe(200);
    const rotatedCookie = extractCookie(firstRefresh, "refreshToken");
    expect(rotatedCookie).not.toBe(originalCookie);

    // Replaying the original (now-revoked) cookie must fail - that's the whole point of rotation.
    const replay = await request(app).post("/api/auth/refresh").set("Cookie", originalCookie);
    expect(replay.status).toBe(401);

    // The new one still works.
    const secondRefresh = await request(app).post("/api/auth/refresh").set("Cookie", rotatedCookie);
    expect(secondRefresh.status).toBe(200);
  });

  it("logout revokes the refresh token so a later refresh fails", async () => {
    const { email, password } = await createTestUser({ password: "CorrectHorse1!" });
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({ email, password });
    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(204);

    const refreshAfterLogout = await agent.post("/api/auth/refresh");
    expect(refreshAfterLogout.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user's profile", async () => {
    const { email, password, user } = await createTestUser({ password: "CorrectHorse1!" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});
