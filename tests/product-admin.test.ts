import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import dataSource from "../data-source";
import { ProductAdminService } from "../src/services/admin/product-admin.service";

let app: Express;
beforeAll(async () => { app = (await import("../app")).createApp(); });
afterEach(() => vi.restoreAllMocks());

describe("Product admin", () => {
  it("rejects serialNumber as an unknown write field before database access", async () => {
    const login = await request(app).post("/api/admin/auth/login").send({ username: "admin", password: "correct-password" });
    const cookie = login.headers["set-cookie"];
    const response = await request(app).post("/api/admin/products").set("Cookie", cookie).send({ name: "P", companyId: 1, serialNumber: 7 });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe(1001);
  });

  it("prevents deletion when batches exist", async () => {
    const service = new ProductAdminService();
    const product = { id: 2, name: "P", company_id: 1 };
    const productRepository = { findOneBy: vi.fn().mockResolvedValue(product), findOne: vi.fn().mockResolvedValue(product), remove: vi.fn() };
    const companyRepository = { find: vi.fn().mockResolvedValue([{ id: 1 }]) };
    const batchRepository = { exist: vi.fn().mockResolvedValue(true) };
    const manager = { getRepository: vi.fn((entity: any) => entity.name === "Product" ? productRepository : entity.name === "Company" ? companyRepository : batchRepository) };
    vi.spyOn(dataSource, "transaction").mockImplementation((async (callback: any) => callback(manager)) as any);
    await expect(service.delete(2)).rejects.toMatchObject({ status: 409, code: 1006 });
    expect(productRepository.remove).not.toHaveBeenCalled();
  });
});
