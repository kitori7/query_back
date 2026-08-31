import { afterEach, describe, expect, it, vi } from "vitest";
import dataSource from "../data-source";
import { BatchAdminService } from "../src/services/admin/batch-admin.service";

afterEach(() => vi.restoreAllMocks());

describe("BatchAdminService", () => {
  it("keeps historical duplicate rows visible and counts codes once for the current page", async () => {
    const service = new BatchAdminService() as any;
    const countBuilder: any = { getCount: vi.fn().mockResolvedValue(2), andWhere: vi.fn().mockReturnThis() };
    const pageBuilder: any = {
      select: vi.fn().mockReturnThis(), addSelect: vi.fn().mockReturnThis(), andWhere: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), offset: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([
        { id: "2", name: "same", createTime: null, productId: "1", productName: "P", companyId: "1", companyName: "C", imgUrls: [] },
        { id: "1", name: "same", createTime: null, productId: "1", productName: "P", companyId: "1", companyName: "C", imgUrls: [] },
      ]),
    };
    service.joinedBuilder = vi.fn().mockReturnValueOnce(countBuilder).mockReturnValueOnce(pageBuilder);
    const codeCountBuilder: any = { select: vi.fn().mockReturnThis(), addSelect: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), groupBy: vi.fn().mockReturnThis(), getRawMany: vi.fn().mockResolvedValue([{ batchId: "2", count: "4" }]) };
    vi.spyOn(dataSource, "getRepository").mockReturnValue({ createQueryBuilder: () => codeCountBuilder } as any);
    const result = await service.list({ page: 1, pageSize: 20 });
    expect(result.items.map((item: any) => item.name)).toEqual(["same", "same"]);
    expect(result.items.map((item: any) => item.codeCount)).toEqual([4, 0]);
    expect(codeCountBuilder.getRawMany).toHaveBeenCalledTimes(1);
  });

  it("writes uniqueness_enforced=1 for newly created batches", async () => {
    const service = new BatchAdminService() as any;
    const productRepository = { find: vi.fn().mockResolvedValue([{ id: 5 }]) };
    const batchRepository = {
      exist: vi.fn().mockResolvedValue(false), create: vi.fn((value) => value), save: vi.fn(async (value) => ({ ...value, id: 8 })),
    };
    const manager = { getRepository: vi.fn((entity: any) => entity.name === "Product" ? productRepository : batchRepository) };
    vi.spyOn(dataSource, "transaction").mockImplementation((async (callback: any) => callback(manager)) as any);
    vi.spyOn(service, "detail").mockResolvedValue({ id: 8 });
    await service.create({ name: "new", productId: 5, imgUrls: [] });
    expect(batchRepository.exist).toHaveBeenCalledWith({ where: { product_id: 5, name: "new" } });
    expect(batchRepository.create).toHaveBeenCalledWith(expect.objectContaining({ uniqueness_enforced: 1 }));
  });

  it("prevents deleting a batch that contains codes", async () => {
    const service = new BatchAdminService();
    const batch = { id: 2, product_id: 1 };
    const batchRepository = { findOneBy: vi.fn().mockResolvedValue(batch), findOne: vi.fn().mockResolvedValue(batch), remove: vi.fn() };
    const productRepository = { find: vi.fn().mockResolvedValue([{ id: 1 }]) };
    const codeRepository = { exist: vi.fn().mockResolvedValue(true) };
    const manager = { getRepository: vi.fn((entity: any) => entity.name === "Batches" ? batchRepository : entity.name === "Product" ? productRepository : codeRepository) };
    vi.spyOn(dataSource, "transaction").mockImplementation((async (callback: any) => callback(manager)) as any);
    await expect(service.delete(2)).rejects.toMatchObject({ status: 409, code: 1006 });
    expect(batchRepository.remove).not.toHaveBeenCalled();
  });
});
