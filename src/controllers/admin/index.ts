import { AdminAuthController } from "./auth.controller";
import { CompanyAdminController } from "./company.controller";
import { ProductAdminController } from "./product.controller";
import { BatchAdminController } from "./batch.controller";
import { CodeAdminController } from "./code.controller";

export const adminControllers = [AdminAuthController, CompanyAdminController, ProductAdminController, BatchAdminController, CodeAdminController];
