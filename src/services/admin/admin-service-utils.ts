import type { EntityManager, EntityTarget, ObjectLiteral } from "typeorm";
import { In } from "typeorm";
import { ApiErrors } from "../../errors/api-error";

export function assertPositiveId(id: number): void {
  if (!Number.isInteger(id) || id < 1) throw ApiErrors.invalid("ID 必须为正整数");
}

export function escapeLikePrefix(value: string): string {
  return `${value.replace(/[\\%_]/g, "\\$&")}%`;
}

export async function lockRowsById<T extends ObjectLiteral & { id: number }>(
  manager: EntityManager,
  entity: EntityTarget<T>,
  ids: number[],
): Promise<T[]> {
  const uniqueIds = [...new Set(ids)].sort((a, b) => a - b);
  if (!uniqueIds.length) return [];
  return manager.getRepository(entity).find({
    where: { id: In(uniqueIds) } as never,
    order: { id: "ASC" } as never,
    lock: { mode: "pessimistic_write" },
  });
}

export function normalizeCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

