import request from "supertest";
import type { Express } from "express";

/** Logs in via the real endpoint (black-box, same as a real client) and returns the access token. */
export async function loginAs(app: Express, email: string, password: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken as string;
}
