import { Authorized, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, QueryParams } from "routing-controllers";
import type { Request } from "express";
import { Req } from "routing-controllers";
import { CompanyOptionsQueryDto, CompanyQueryDto, CreateCompanyDto, UpdateCompanyDto } from "../../dto/admin/company.dto";
import { CompanyAdminService } from "../../services/admin/company-admin.service";
import { success } from "../../utils/api-response";
import { auditWrite } from "../../utils/audit-log";

@Authorized("ADMIN")
@Controller("/api/admin/companies")
export class CompanyAdminController {
  private service = new CompanyAdminService();
  @Get() async list(@QueryParams() query: CompanyQueryDto) { return success(await this.service.list(query)); }
  @Get("/options") async options(@QueryParams() query: CompanyOptionsQueryDto) { return success(await this.service.options(query)); }
  @Get("/:id") async detail(@Param("id") id: number) { return success(await this.service.detail(Number(id))); }
  @Post() @HttpCode(201) async create(@Body() body: CreateCompanyDto, @Req() request: Request) { const item = await this.service.create(body); auditWrite(request, "create", "Company", item.id); return success(item); }
  @Patch("/:id") async update(@Param("id") id: number, @Body() body: UpdateCompanyDto, @Req() request: Request) { const item = await this.service.update(Number(id), body); auditWrite(request, "update", "Company", item.id); return success(item); }
  @Delete("/:id") async delete(@Param("id") id: number, @Req() request: Request) { const item = await this.service.delete(Number(id)); auditWrite(request, "delete", "Company", item.id); return success(item); }
}
