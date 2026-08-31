import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/config/env";

function validEnv(): NodeJS.ProcessEnv {
  return {
    DB_HOST: "127.0.0.1",
    DB_PORT: "3306",
    DB_USERNAME: "user",
    DB_PASSWORD: "top-secret-value",
    DB_DATABASE: "db",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD_HASH: "$2a$04$G.RKJIpOp5KAo.KpU/21I.wqodgsYSGDpRFYY7K5KqHNhl1VxoYeG",
    ADMIN_JWT_SECRET: "12345678901234567890123456789012",
    ADMIN_ALLOWED_ORIGIN: "http://localhost:5173",
  };
}

describe("parseEnv", () => {
  it("parses safe defaults", () => {
    const result = parseEnv(validEnv());
    expect(result.port).toBe(3000);
    expect(result.dbLogging).toBe(false);
    expect(result.adminTokenTtlSeconds).toBe(28800);
  });

  it("reports only the invalid variable name", () => {
    const source = validEnv();
    source.DB_HOST = "";
    expect(() => parseEnv(source)).toThrow("DB_HOST");
    try {
      parseEnv(source);
    } catch (error) {
      expect(String(error)).not.toContain("top-secret-value");
    }
  });

  it("rejects wildcard origins and weak secrets", () => {
    expect(() => parseEnv({ ...validEnv(), ADMIN_ALLOWED_ORIGIN: "*" })).toThrow("ADMIN_ALLOWED_ORIGIN");
    expect(() => parseEnv({ ...validEnv(), ADMIN_JWT_SECRET: "short" })).toThrow("ADMIN_JWT_SECRET");
  });

  it("rejects prefix-only and incomplete bcrypt hashes", () => {
    expect(() => parseEnv({ ...validEnv(), ADMIN_PASSWORD_HASH: "$2b$12$" })).toThrow("ADMIN_PASSWORD_HASH");
    expect(() => parseEnv({ ...validEnv(), ADMIN_PASSWORD_HASH: "$2a$04$short" })).toThrow("ADMIN_PASSWORD_HASH");
  });

  it("always disables SQL logging in production", () => {
    expect(parseEnv({ ...validEnv(), NODE_ENV: "production", DB_LOGGING: "true" }).dbLogging).toBe(false);
  });
});
