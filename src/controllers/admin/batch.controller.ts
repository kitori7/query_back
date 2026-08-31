import { Authorized, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, QueryParams, QueryParam, Res } from "routing-controllers";
import type { Response } from "express";
import type { Request } from "express";
import { Req } from "routing-controllers";
import { BatchOptionsQueryDto, BatchQueryDto, CreateBatchDto, UpdateBatchDto } from "../../dto/admin/batch.dto";
import { assertNonEmptyPatch } from "../../dto/admin/common.dto";
import { BatchAdminService } from "../../services/admin/batch-admin.service";
import { BatchService } from "../../services/batches.service";
import { success } from "../../utils/api-response";
import { auditWrite } from "../../utils/audit-log";

@Authorized("ADMIN")
@Controller("/api/admin/batches")
export class BatchAdminController {
  private service = new BatchAdminService();
  private batchService = new BatchService();
  @Get() async list(@QueryParams() query: BatchQueryDto) { return success(await this.service.list(query)); }
  @Get("/options") async options(@QueryParams() query: BatchOptionsQueryDto) { return success(await this.service.options(query)); }
 @Get("/:id") async detail(@Param("id") id: number) { return success(await this.service.detail(Number(id))); }
  @Get("/:id/export") async exportBatch(@Param("id") id: number, @QueryParam("startSerial") startSerial: string | undefined, @Res() response: Response) { await this.batchService.writeExport(Number(id), startSerial === undefined ? 1 : Number(startSerial), response); return response; }
  @Post() @HttpCode(201) async create(@Body() body: CreateBatchDto, @Req() request: Request) { const item = await this.service.create(body); auditWrite(request, "create", "Batches", item.id); return success(item); }
  @Patch("/:id") async update(@Param("id") id: number, @Body() body: UpdateBatchDto, @Req() request: Request) { assertNonEmptyPatch(body); const item = await this.service.update(Number(id), body); auditWrite(request, "update", "Batches", item.id); return success(item); }
  @Delete("/:id") async delete(@Param("id") id: number, @Req() request: Request) { const item = await this.service.delete(Number(id)); auditWrite(request, "delete", "Batches", item.id); return success(item); }
}
