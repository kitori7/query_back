import request from "supertest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import { CreateProductDto, UpdateProductDto } from "../src/dto/admin/product.dto";
import { assertNonEmptyPatch } from "../src/dto/admin/common.dto";

let app: Express;
beforeAll(async () => { app = (await import("../app")).createApp(); });

describe("DTO and error contract", () => {
  it("rejects unknown body fields and returns request id", async () => {
    const response = await request(app).post("/api/admin/auth/login").set("X-Request-Id", "known-request-id").send({
      username: "admin",
      password: "correct-password",
      unexpected: true,
    });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe(1001);
    expect(response.headers["x-request-id"]).toBe("known-request-id");
  });

  it("validates URL protocol", async () => {
    const dto = plainToInstance(CreateProductDto, { name: "P", companyId: 1, contractImg: "javascript:alert(1)" });
    expect(await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).not.toHaveLength(0);
  });

  it("rejects empty patch objects", () => {
    expect(() => assertNonEmptyPatch(new UpdateProductDto())).toThrow("至少需要");
  });
});
