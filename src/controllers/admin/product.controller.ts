import { Authorized, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, QueryParams } from "routing-controllers";
import type { Request } from "express";
import { Req } from "routing-controllers";
import { CreateProductDto, ProductOptionsQueryDto, ProductQueryDto, UpdateProductDto } from "../../dto/admin/product.dto";
import { assertNonEmptyPatch } from "../../dto/admin/common.dto";
import { ProductAdminService } from "../../services/admin/product-admin.service";
import { success } from "../../utils/api-response";
import { auditWrite } from "../../utils/audit-log";

@Authorized("ADMIN")
@Controller("/api/admin/products")
export class ProductAdminController {
  private service = new ProductAdminService();
  @Get() async list(@QueryParams() query: ProductQueryDto) { return success(await this.service.list(query)); }
  @Get("/options") async options(@QueryParams() query: ProductOptionsQueryDto) { return success(await this.service.options(query)); }
  @Get("/:id") async detail(@Param("id") id: number) { return success(await this.service.detail(Number(id))); }
  @Post() @HttpCode(201) async create(@Body() body: CreateProductDto, @Req() request: Request) { const item = await this.service.create(body); auditWrite(request, "create", "Product", item.id); return success(item); }
  @Patch("/:id") async update(@Param("id") id: number, @Body() body: UpdateProductDto, @Req() request: Request) { assertNonEmptyPatch(body); const item = await this.service.update(Number(id), body); auditWrite(request, "update", "Product", item.id); return success(item); }
  @Delete("/:id") async delete(@Param("id") id: number, @Req() request: Request) { const item = await this.service.delete(Number(id)); auditWrite(request, "delete", "Product", item.id); return success(item); }
}
