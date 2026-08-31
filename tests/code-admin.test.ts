import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import dataSource from "../data-source";
import { CodeAdminService } from "../src/services/admin/code-admin.service";

let app: Express;
beforeAll(async () => { app = (await import("../app")).createApp(); });
afterEach(() => vi.restoreAllMocks());

function chain(extra: Record<string, unknown> = {}): any {
  const value: any = { innerJoin: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), addSelect: vi.fn().mockReturnThis(), andWhere: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), offset: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), ...extra };
  return value;
}

describe("CodeAdminService", () => {
  it("uses ID pagination then restores the ID page order", async () => {
    const service = new CodeAdminService() as any;
    const count = chain({ getCount: vi.fn().mockResolvedValue(2) });
    const ids = chain({ getRawMany: vi.fn().mockResolvedValue([{ id: "9" }, { id: "7" }]) });
    const details = chain({ getRawMany: vi.fn().mockResolvedValue([
      { id: "7", batchId: "1", batchName: "B", productId: "1", productName: "P", companyId: "1", companyName: "C", codeUuid: "1234567890", url: "http://x/7", usedSum: "2", usedTime: null },
      { id: "9", batchId: "1", batchName: "B", productId: "1", productName: "P", companyId: "1", companyName: "C", codeUuid: "abcdefghij", url: "http://x/9", usedSum: "0", usedTime: null },
    ]) });
    service.repository = { createQueryBuilder: vi.fn().mockReturnValueOnce(count).mockReturnValueOnce(ids).mockReturnValueOnce(details) };
    const result = await service.list({ page: 1, pageSize: 20 });
    expect(result.items.map((item: any) => item.id)).toEqual([9, 7]);
    expect(ids.select).toHaveBeenCalledWith("code.id", "id");
  });

  it("uses exact matching for ten characters and prefix matching otherwise", () => {
    const service = new CodeAdminService() as any;
    const exact = chain(); service.repository = { createQueryBuilder: () => exact };
    service.filteredBuilder({ page: 1, pageSize: 20, codeUuid: "1234567890" });
    expect(exact.andWhere).toHaveBeenCalledWith("code.code_uuid = :codeUuid", { codeUuid: "1234567890" });
    const prefix = chain(); service.repository = { createQueryBuilder: () => prefix };
    service.filteredBuilder({ page: 1, pageSize: 20, codeUuid: "123" });
    expect(prefix.andWhere).toHaveBeenCalledWith(expect.stringContaining("LIKE"), { codeUuid: "123%" });
  });

  it("creates codes with read-only statistics initialized explicitly", async () => {
    const service = new CodeAdminService() as any;
    const batchRepository = { find: vi.fn().mockResolvedValue([{ id: 4 }]) };
    const codeRepository = { exist: vi.fn().mockResolvedValue(false), create: vi.fn((value) => value), save: vi.fn(async (value) => ({ ...value, id: 3 })) };
    const manager = { getRepository: vi.fn((entity: any) => entity.name === "Batches" ? batchRepository : codeRepository) };
    vi.spyOn(dataSource, "transaction").mockImplementation((async (callback: any) => callback(manager)) as any);
    vi.spyOn(service, "detail").mockResolvedValue({ id: 3 });
    await service.create({ codeUuid: "1234567890", url: "http://example.com/?uuid=1234567890", batchId: 4 });
    expect(codeRepository.create).toHaveBeenCalledWith(expect.objectContaining({ used_sum: 0, used_time: null }));
  });

  it("rejects usedSum and usedTime writes before database access", async () => {
    const login = await request(app).post("/api/admin/auth/login").send({ username: "admin", password: "correct-password" });
    const response = await request(app).patch("/api/admin/codes/1").set("Cookie", login.headers["set-cookie"]).send({ usedSum: 10, usedTime: "now" });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe(1001);
  });
});
