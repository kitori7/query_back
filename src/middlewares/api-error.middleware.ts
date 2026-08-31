import type { NextFunction, Request, Response } from "express";
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from "routing-controllers";
import { ApiError, isDuplicateEntry } from "../errors/api-error";

type ValidationLike = { constraints?: Record<string, string>; property?: string; children?: ValidationLike[] };

function flattenValidation(errors: ValidationLike[] | undefined): string[] {
  if (!errors) return [];
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...flattenValidation(error.children),
  ]);
}

@Middleware({ type: "after" })
export class ApiErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: unknown, request: Request, response: Response, _next: NextFunction): void {
    const requestId = String(response.locals.requestId ?? "unknown");
    if (error instanceof ApiError) {
      response.status(error.status).json({
        code: error.code,
        data: null,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      });
      return;
    }
    if (isDuplicateEntry(error)) {
      response.status(409).json({ code: 1005, data: null, message: "数据已存在" });
      return;
    }
    if (error instanceof HttpError) {
      const validationErrors = flattenValidation((error as HttpError & { errors?: ValidationLike[] }).errors);
      if (error.httpCode === 401 || error.httpCode === 403) {
        response.status(401).json({ code: 1002, data: null, message: "未登录或登录已失效" });
        return;
      }
      if (error.httpCode === 400) {
        response.status(400).json({
          code: 1001,
          data: null,
          message: "请求参数不合法",
          ...(validationErrors.length ? { details: validationErrors } : {}),
        });
        return;
      }
    }
    const safeError = error instanceof Error
      ? { name: error.name, stack: error.stack?.split("\n").slice(1).join("\n") }
      : { name: "UnknownError" };
    console.error("Unhandled request error", { requestId, method: request.method, path: request.path, ...safeError });
    response.status(500).json({ code: 1500, data: null, message: "服务器内部错误" });
  }
}
