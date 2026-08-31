import dotenv from "dotenv";

dotenv.config();

export type AppEnv = {
  nodeEnv: string;
  port: number;
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword: string;
  dbDatabase: string;
  dbLogging: boolean;
  adminUsername: string;
  adminPasswordHash: string;
  adminJwtSecret: string;
  adminTokenTtlSeconds: number;
  adminAllowedOrigin: string;
};

function required(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Invalid environment variable: ${name}`);
  return value;
}

function integer(
  source: NodeJS.ProcessEnv,
  name: string,
  fallback: number | undefined,
  min: number,
  max: number,
): number {
  const raw = source[name]?.trim();
  if (!raw && fallback !== undefined) return fallback;
  if (!raw || !/^\d+$/.test(raw)) {
    throw new Error(`Invalid environment variable: ${name}`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`Invalid environment variable: ${name}`);
  }
  return value;
}

function boolean(source: NodeJS.ProcessEnv, name: string, fallback: boolean): boolean {
  const raw = source[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`Invalid environment variable: ${name}`);
}

function origin(source: NodeJS.ProcessEnv): string {
  const value = required(source, "ADMIN_ALLOWED_ORIGIN");
  if (value === "*") throw new Error("Invalid environment variable: ADMIN_ALLOWED_ORIGIN");
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== value) {
      throw new Error();
    }
  } catch {
    throw new Error("Invalid environment variable: ADMIN_ALLOWED_ORIGIN");
  }
  return value;
}

export function parseEnv(source: NodeJS.ProcessEnv): AppEnv {
  const nodeEnv = source.NODE_ENV?.trim() || "development";
  const adminPasswordHash = required(source, "ADMIN_PASSWORD_HASH");
  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(adminPasswordHash)) {
    throw new Error("Invalid environment variable: ADMIN_PASSWORD_HASH");
  }
  const adminJwtSecret = required(source, "ADMIN_JWT_SECRET");
  if (adminJwtSecret.length < 32) {
    throw new Error("Invalid environment variable: ADMIN_JWT_SECRET");
  }
  return {
    nodeEnv,
    port: integer(source, "PORT", 3000, 1, 65535),
    dbHost: required(source, "DB_HOST"),
    dbPort: integer(source, "DB_PORT", undefined, 1, 65535),
    dbUsername: required(source, "DB_USERNAME"),
    dbPassword: required(source, "DB_PASSWORD"),
    dbDatabase: required(source, "DB_DATABASE"),
    dbLogging: nodeEnv === "production" ? false : boolean(source, "DB_LOGGING", false),
    adminUsername: required(source, "ADMIN_USERNAME"),
    adminPasswordHash,
    adminJwtSecret,
    adminTokenTtlSeconds: integer(source, "ADMIN_TOKEN_TTL_SECONDS", 28800, 1, 2_147_483_647),
    adminAllowedOrigin: origin(source),
  };
}

export const env = parseEnv(process.env);
