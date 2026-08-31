import { describe, expect, it, vi } from "vitest";
import { CodeAdminService } from "../src/services/admin/code-admin.service";

function chain(extra: Record<string, unknown> = {}): any {
  return { innerJoin: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), addSelect: vi.fn().mockReturnThis(), andWhere: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), offset: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), ...extra };
}

describe("deep page query shape", () => {
  it("fetches only 20 detail rows for rows 900001-900020", async () => {
    const service = new CodeAdminService() as any;
    const count = chain({ getCount: vi.fn().mockResolvedValue(1_000_000) });
    const idRows = Array.from({ length: 20 }, (_, index) => ({ id: String(100_000 - index) }));
    const ids = chain({ getRawMany: vi.fn().mockResolvedValue(idRows) });
    const details = chain({ getRawMany: vi.fn().mockResolvedValue(idRows.map((row) => ({ id: row.id, batchId: "1", batchName: "B", productId: "1", productName: "P", companyId: "1", companyName: "C", codeUuid: "1234567890", url: "http://x", usedSum: "0", usedTime: null }))) });
    service.repository = { createQueryBuilder: vi.fn().mockReturnValueOnce(count).mockReturnValueOnce(ids).mockReturnValueOnce(details) };
    const started = performance.now();
    const result = await service.list({ page: 45_001, pageSize: 20 });
    const elapsed = performance.now() - started;
    expect(ids.offset).toHaveBeenCalledWith(900_000);
    expect(ids.limit).toHaveBeenCalledWith(20);
    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(1_000_000);
    expect(elapsed).toBeLessThan(1000);
  });
});
