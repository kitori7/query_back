import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { ApiErrors } from "../errors/api-error";

export type AdminPrincipal = { username: string; role: "ADMIN" };

export class AdminAuthService {
  async login(username: string, password: string): Promise<string> {
    const usernameMatches = username === env.adminUsername;
    const passwordMatches = await bcrypt.compare(password, env.adminPasswordHash);
    if (!usernameMatches || !passwordMatches) throw ApiErrors.invalidCredentials();
    return jwt.sign({ role: "ADMIN" }, env.adminJwtSecret, {
      algorithm: "HS256",
      subject: env.adminUsername,
      issuer: "query-back",
      audience: "query-admin",
      expiresIn: env.adminTokenTtlSeconds,
    });
  }

  verify(token: string): AdminPrincipal {
    try {
      const payload = jwt.verify(token, env.adminJwtSecret, {
        algorithms: ["HS256"],
        issuer: "query-back",
        audience: "query-admin",
      }) as JwtPayload;
      if (payload.role !== "ADMIN" || payload.sub !== env.adminUsername) {
        throw ApiErrors.unauthorized();
      }
      return { username: payload.sub, role: "ADMIN" };
    } catch {
      throw ApiErrors.unauthorized();
    }
  }
}

export const adminAuthService = new AdminAuthService();

