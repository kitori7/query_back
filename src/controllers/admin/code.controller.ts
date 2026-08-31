import { Authorized, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, QueryParams } from "routing-controllers";
import type { Request } from "express";
import { Req } from "routing-controllers";
import { CodeQueryDto, CreateCodeDto, UpdateCodeDto } from "../../dto/admin/code.dto";
import { assertNonEmptyPatch } from "../../dto/admin/common.dto";
import { CodeAdminService } from "../../services/admin/code-admin.service";
import { success } from "../../utils/api-response";
import { auditWrite } from "../../utils/audit-log";

@Authorized("ADMIN")
@Controller("/api/admin/codes")
export class CodeAdminController {
  private service = new CodeAdminService();
  @Get() async list(@QueryParams() query: CodeQueryDto, @Req() request: Request & { requestId?: string }) { const started = performance.now(); const result = await this.service.list(query); console.info("Admin code list", { requestId: request.requestId ?? "unknown", page: query.page, pageSize: query.pageSize, filterTypes: [query.codeUuid ? "codeUuid" : null, query.companyId ? "companyId" : null, query.productId ? "productId" : null, query.batchId ? "batchId" : null].filter(Boolean), durationMs: Math.round(performance.now() - started) }); return success(result); }
  @Get("/:id") async detail(@Param("id") id: number) { return success(await this.service.detail(Number(id))); }
  @Post() @HttpCode(201) async create(@Body() body: CreateCodeDto, @Req() request: Request) { const item = await this.service.create(body); auditWrite(request, "create", "Code", item.id); return success(item); }
  @Patch("/:id") async update(@Param("id") id: number, @Body() body: UpdateCodeDto, @Req() request: Request) { assertNonEmptyPatch(body); const item = await this.service.update(Number(id), body); auditWrite(request, "update", "Code", item.id); return success(item); }
  @Delete("/:id") async delete(@Param("id") id: number, @Req() request: Request) { const item = await this.service.delete(Number(id)); auditWrite(request, "delete", "Code", item.id); return success(item); }
}
