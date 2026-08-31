export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const ApiErrors = {
  invalid: (message = "请求参数不合法", details?: unknown) => new ApiError(400, 1001, message, details),
  unauthorized: (message = "未登录或登录已失效") => new ApiError(401, 1002, message),
  invalidCredentials: () => new ApiError(401, 1003, "管理员账号或密码错误"),
  notFound: (message: string) => new ApiError(404, 1004, message),
  conflict: (message: string) => new ApiError(409, 1005, message),
  dependencyExists: (message: string) => new ApiError(409, 1006, message),
  deprecated: (message: string) => new ApiError(410, 1007, message),
  rateLimited: () => new ApiError(429, 1008, "登录请求过于频繁，请稍后重试"),
};

export function isDuplicateEntry(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY";
}

