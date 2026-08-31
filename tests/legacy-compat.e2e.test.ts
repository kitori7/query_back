import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import { BatchService } from "../src/services/batches.service";
import { CodeService } from "../src/services/code.service";

let app: Express;
let cookie: string[];

beforeAll(async () => {
  app = (await import("../app")).createApp();
  const login = await request(app).post("/api/admin/auth/login").send({ username: "admin", password: "correct-password" });
  cookie = login.headers["set-cookie"];
});

describe("legacy compatibility", () => {
  it("requires ADMIN for create, apply, and queryList", async () => {
    expect((await request(app).post("/api/batch/create").send({ productId: 1, batchName: "B", codeCount: 1 })).status).toBe(401);
    expect((await request(app).post("/api/batch/apply").send({ batchId: 1, codeCount: 1 })).status).toBe(401);
    expect((await request(app).get("/api/code/queryList")).status).toBe(401);
  });

  it("preserves successful legacy response bodies", async () => {
    vi.spyOn(BatchService.prototype, "createBatch").mockResolvedValue({ id: 1 } as any);
    vi.spyOn(BatchService.prototype, "applyBatch").mockResolvedValue({ id: 1 } as any);
    const created = await request(app).post("/api/batch/create").set("Cookie", cookie).send({ productId: 1, batchName: "B", codeCount: 1 });
    const applied = await request(app).post("/api/batch/apply").set("Cookie", cookie).send({ batchId: 1, codeCount: 1 });
    expect(created.status).toBe(200);
    expect(created.body).toEqual({ code: 200, data: true, msg: "添加成功" });
    expect(applied.body).toEqual({ code: 200, data: true, msg: "添加成功" });
  });

  it("returns 410 for the authenticated full-list endpoint without querying", async () => {
    const query = vi.spyOn(CodeService.prototype, "queryList");
    const response = await request(app).get("/api/code/queryList").set("Cookie", cookie);
    expect(response.status).toBe(410);
    expect(response.body.code).toBe(1007);
    expect(query).not.toHaveBeenCalled();
  });

  it("keeps public verification open and preserves its response fields", async () => {
    vi.spyOn(CodeService.prototype, "getDetailByUUid").mockResolvedValue({
      isFirst: true, usedSum: 0, usedTime: null, batchName: "B", productName: "P", companyName: "C", imgUrl: [],
    });
    const response = await request(app).get("/api/code/1234567890");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 200,
      data: { isFirst: true, usedSum: 0, usedTime: null, batchName: "B", productName: "P", companyName: "C", imgUrl: [] },
      msg: "获取成功",
    });
  });
});
