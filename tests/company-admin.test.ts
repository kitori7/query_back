import { afterEach, describe, expect, it, vi } from "vitest";
import dataSource from "../data-source";
import { CompanyAdminService } from "../src/services/admin/company-admin.service";

afterEach(() => vi.restoreAllMocks());

describe("CompanyAdminService", () => {
  it("returns stable pagination and one grouped count query", async () => {
    const service = new CompanyAdminService() as any;
    const companyBuilder: any = {
      where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), skip: vi.fn().mockReturnThis(), take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[{ id: 3, name: "Acme" }], 1]),
    };
    service.repository = { createQueryBuilder: vi.fn(() => companyBuilder) };
    const countBuilder: any = {
      select: vi.fn().mockReturnThis(), addSelect: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), groupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([{ companyId: "3", count: "2" }]),
    };
    vi.spyOn(dataSource, "getRepository").mockReturnValue({ createQueryBuilder: () => countBuilder } as any);
    await expect(service.list({ page: 1, pageSize: 20 })).resolves.toEqual({ items: [{ id: 3, name: "Acme", productCount: 2 }], page: 1, pageSize: 20, total: 1 });
    expect(countBuilder.getRawMany).toHaveBeenCalledTimes(1);
  });

  it("rejects a duplicate name before insert", async () => {
    const service = new CompanyAdminService() as any;
    service.repository = { exist: vi.fn().mockResolvedValue(true) };
    await expect(service.create({ name: "Acme" })).rejects.toMatchObject({ status: 409, code: 1005 });
  });

  it("prevents deleting a company with products", async () => {
    const service = new CompanyAdminService();
    const companyRepository = { findOne: vi.fn().mockResolvedValue({ id: 1, name: "Acme" }), remove: vi.fn() };
    const productRepository = { exist: vi.fn().mockResolvedValue(true) };
    const manager = { getRepository: vi.fn((entity: any) => entity.name === "Company" ? companyRepository : productRepository) };
    vi.spyOn(dataSource, "transaction").mockImplementation((async (callback: any) => callback(manager)) as any);
    await expect(service.delete(1)).rejects.toMatchObject({ status: 409, code: 1006 });
    expect(companyRepository.remove).not.toHaveBeenCalled();
  });
});
