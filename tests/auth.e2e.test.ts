import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import jwt from "jsonwebtoken";

let app: Express;

beforeAll(async () => {
  app = (await import("../app")).createApp();
});

describe("admin auth", () => {
  it("logs in, reads principal, and logs out with a scoped HttpOnly cookie", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/admin/auth/login").send({ username: "admin", password: "correct-password" });
    expect(login.status).toBe(200);
    expect(login.body).toEqual({ code: 0, data: { username: "admin", role: "ADMIN" }, message: "success" });
    expect(login.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(login.headers["set-cookie"]?.[0]).toContain("SameSite=Lax");
    expect(login.headers["set-cookie"]?.[0]).toContain("Path=/api");

    const me = await agent.get("/api/admin/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.role).toBe("ADMIN");

    const logout = await agent.post("/api/admin/auth/logout");
    expect(logout.status).toBe(200);
    expect(logout.headers["set-cookie"]?.[0]).toContain("query_admin_token=");
    expect((await agent.get("/api/admin/auth/me")).status).toBe(401);
  });

  it("does not disclose which credential is wrong", async () => {
    const wrongUser = await request(app).post("/api/admin/auth/login").send({ username: "nobody", password: "correct-password" });
    const wrongPassword = await request(app).post("/api/admin/auth/login").send({ username: "admin", password: "wrong-password" });
    expect(wrongUser.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(wrongUser.body).toEqual(wrongPassword.body);
    expect(wrongUser.body.code).toBe(1003);
  });

  it("rejects tampered tokens", async () => {
    const response = await request(app).get("/api/admin/auth/me").set("Cookie", "query_admin_token=invalid.token.value");
    expect(response.status).toBe(401);
    expect(response.body.code).toBe(1002);
  });

  it("rejects expired tokens", async () => {
    const token = jwt.sign({ role: "ADMIN" }, process.env.ADMIN_JWT_SECRET!, {
      algorithm: "HS256", subject: "admin", issuer: "query-back", audience: "query-admin", expiresIn: -1,
    });
    const response = await request(app).get("/api/admin/auth/me").set("Cookie", `query_admin_token=${token}`);
    expect(response.status).toBe(401);
    expect(response.body.code).toBe(1002);
  });

  it("rate limits repeated login attempts", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 12; index += 1) {
      statuses.push((await request(app).post("/api/admin/auth/login").send({ username: "admin", password: "wrong-password" })).status);
    }
    expect(statuses).toContain(429);
  });
});
