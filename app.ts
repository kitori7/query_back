import "reflect-metadata";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { useExpressServer } from "routing-controllers";
import { env } from "./src/config/env";
import { authorizationChecker } from "./src/auth/authorization-checker";
import { ApiErrorMiddleware } from "./src/middlewares/api-error.middleware";
import { requestIdMiddleware } from "./src/middlewares/request-id.middleware";
import { requestSchemaGuard } from "./src/middlewares/request-schema-guard.middleware";
import { BatchController } from "./src/controllers/batches.controll";
import { codeController } from "./src/controllers/code.controller";
import { adminControllers } from "./src/controllers/admin";

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(cors({ origin: env.adminAllowedOrigin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestSchemaGuard);

  useExpressServer(app, {
    controllers: [codeController, BatchController, ...adminControllers],
    middlewares: [ApiErrorMiddleware],
    authorizationChecker,
    defaultErrorHandler: false,
    classTransformer: true,
    validation: {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
    },
  });
  return app;
}
