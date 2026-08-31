import { afterEach, describe, expect, it, vi } from "vitest";
import dataSource from "../data-source";
import { CodeAdminService } from "../src/services/admin/code-admin.service";
import { CompanyAdminService } from "../src/services/admin/company-admin.service";

afterEach(() => vi.restoreAllMocks());

describe("locking contracts", () => {
  it("locks the parent batch before checking/inserting a code", async () => {
    const events: string[] = [];
    const batchRepository = { find: vi.fn(async () => { events.push("lock-batch"); return [{ id: 1 }]; }) };
    const codeRepository = {
      exist: vi.fn(async () => { events.push("check-code"); return false; }),
      create: vi.fn((value) => value),
      save: vi.fn(async (value) => { events.push("save-code"); return { ...value, id: 2 }; }),
    };
    const manager = { getRepository: vi.fn((entity: any) => entity.name === "Batches" ? batchRepository : codeRepository) };
    vi.spyOn(dataSource, "transaction").mockImplementation((async (callback: any) => callback(manager)) as any);
    const service = new CodeAdminService() as any;
    vi.spyOn(service, "detail").mockResolvedValue({ id: 2 });
    await service.create({ codeUuid: "1234567890", url: "http://example.com/?uuid=1234567890", batchId: 1 });
    expect(events).toEqual(["lock-batch", "check-code", "save-code"]);
  });

  it("locks a company before checking children and never cascades", async () => {
    const events: string[] = [];
    const companyRepository = {
      findOne: vi.fn(async () => { events.push("lock-company"); return { id: 1, name: "C" }; }),
      remove: vi.fn(async () => events.push("remove-company")),
    };
    const productRepository = { exist: vi.fn(async () => { events.push("check-products"); return true; }) };
    const manager = { getRepository: vi.fn((entity: any) => entity.name === "Company" ? companyRepository : productRepository) };
    vi.spyOn(dataSource, "transaction").mockImplementation((async (callback: any) => callback(manager)) as any);
    await expect(new CompanyAdminService().delete(1)).rejects.toMatchObject({ code: 1006 });
    expect(events).toEqual(["lock-company", "check-products"]);
  });
});

