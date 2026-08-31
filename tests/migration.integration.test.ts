import { describe, expect, it, vi } from "vitest";
import { AdminFoundationIndexes202608310001 } from "../migrations/202608310001-AdminFoundationIndexes";

function queryRunner(historicalDuplicateCount = 2) {
  const statements: string[] = [];
  return {
    statements,
    runner: {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        if (sql.includes("duplicate_batch") && sql.startsWith("SELECT")) return [{ count: historicalDuplicateCount }];
        if (sql.startsWith("SELECT")) return [{ count: 0 }];
        return [];
      }),
    } as any,
  };
}

describe("AdminFoundationIndexes migration contract", () => {
  it("allows historical duplicate batches without updating historical rows", async () => {
    const migration = new AdminFoundationIndexes202608310001();
    const { runner, statements } = queryRunner(2);
    await migration.up(runner);
    expect(statements.some((sql) => /UPDATE\s+batches/i.test(sql))).toBe(false);
    expect(statements).toContain("ALTER TABLE batches ADD COLUMN uniqueness_enforced TINYINT NULL DEFAULT NULL");
    expect(statements.some((sql) => sql.includes("uq_batches_product_name_enforced"))).toBe(true);
    expect(statements.some((sql) => sql.includes("uq_code_uuid"))).toBe(true);
    expect(statements.some((sql) => sql.includes("idx_code_batches_id_id"))).toBe(true);
  });

  it("defines a reversible down sequence and can generate up again", async () => {
    const migration = new AdminFoundationIndexes202608310001();
    const first = queryRunner(); await migration.up(first.runner); await migration.down(first.runner);
    const second = queryRunner(); await migration.up(second.runner);
    expect(first.statements.filter((sql) => sql.startsWith("ALTER TABLE") && sql.includes("DROP")).length).toBe(6);
    expect(second.statements.filter((sql) => sql.startsWith("ALTER TABLE")).length).toBe(6);
  });

  it("stops before DDL when a blocking precheck fails", async () => {
    const migration = new AdminFoundationIndexes202608310001();
    const statements: string[] = [];
    const runner = { query: vi.fn(async (sql: string) => { statements.push(sql); return [{ count: 1 }]; }) } as any;
    await expect(migration.up(runner)).rejects.toThrow("company name");
    expect(statements.some((sql) => sql.startsWith("ALTER TABLE"))).toBe(false);
  });
});

