import type { CookieOptions, Response } from "express";
import { env } from "../config/env";

export const ADMIN_COOKIE_NAME = "query_admin_token";

function options(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/api",
    maxAge: env.adminTokenTtlSeconds * 1000,
  };
}

export function setAdminCookie(response: Response, token: string): void {
  response.cookie(ADMIN_COOKIE_NAME, token, options());
}

export function clearAdminCookie(response: Response): void {
  const { maxAge: _maxAge, ...clearOptions } = options();
  response.clearCookie(ADMIN_COOKIE_NAME, clearOptions);
}

