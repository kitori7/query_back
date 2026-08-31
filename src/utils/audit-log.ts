import type { Request } from "express";

type RequestWithId = Request & { requestId?: string };

export function auditWrite(request: Request, action: "create" | "update" | "delete", entity: string, entityId: number): void {
  console.info("Admin write", { action, entity, entityId, result: "success", requestId: (request as RequestWithId).requestId ?? "unknown" });
}
