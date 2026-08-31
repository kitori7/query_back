import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { Authorized, Body, Controller, Get, Post, Req, Res, UseBefore } from "routing-controllers";
import { adminAuthService } from "../../auth/admin-auth.service";
import { clearAdminCookie, setAdminCookie } from "../../auth/admin-cookie";
import type { AdminRequest } from "../../auth/authorization-checker";
import { LoginDto } from "../../dto/admin/auth.dto";
import { success } from "../../utils/api-response";

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request: Request, response: Response) => {
    response.status(429).json({ code: 1008, data: null, message: "登录请求过于频繁，请稍后重试" });
  },
});

@Controller("/api/admin/auth")
export class AdminAuthController {
  @Post("/login")
  @UseBefore(loginRateLimiter)
  async login(@Body() body: LoginDto, @Req() request: Request & { requestId?: string }, @Res() response: Response) {
    try {
      const token = await adminAuthService.login(body.username, body.password);
      setAdminCookie(response, token);
      return success({ username: body.username, role: "ADMIN" as const });
    } catch (error) {
      console.warn("Admin login failed", { requestId: request.requestId ?? "unknown", ip: request.ip });
      throw error;
    }
  }

  @Authorized("ADMIN")
  @Get("/me")
  me(@Req() request: AdminRequest) {
    return success(request.admin!);
  }

  @Post("/logout")
  logout(@Res() response: Response) {
    clearAdminCookie(response);
    return success(true);
  }
}
