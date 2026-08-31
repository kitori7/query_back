import { randomUUID } from "crypto";
import type { RequestHandler } from "express";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const incoming = request.header("X-Request-Id");
  const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  (request as typeof request & { requestId?: string }).requestId = requestId;
  response.locals.requestId = requestId;
  response.setHeader("X-Request-Id", requestId);
  next();
};
