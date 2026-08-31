import type { Request } from "express";
import type { RoutingControllersOptions } from "routing-controllers";
import { ADMIN_COOKIE_NAME } from "./admin-cookie";
import { adminAuthService, type AdminPrincipal } from "./admin-auth.service";

export type AdminRequest = Request & { admin?: AdminPrincipal };

export const authorizationChecker: NonNullable<RoutingControllersOptions["authorizationChecker"]> = async (action, roles) => {
  const request = action.request as AdminRequest & { cookies?: Record<string, string> };
  const token = request.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) return false;
  try {
    const principal = adminAuthService.verify(token);
    request.admin = principal;
    return roles.length === 0 || roles.includes(principal.role);
  } catch {
    return false;
  }
};
