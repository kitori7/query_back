import dataSource from "../../../data-source";
import { Batches } from "../../entities/batches.entity";
import { Code } from "../../entities/code.entity";
import { Company } from "../../entities/company.entity";
import { Product } from "../../entities/product.entity";
import type { CodeQueryDto, CreateCodeDto, UpdateCodeDto } from "../../dto/admin/code.dto";
import { ApiErrors, isDuplicateEntry } from "../../errors/api-error";
import type { PageData } from "../../utils/api-response";
import { assertPositiveId, escapeLikePrefix, lockRowsById } from "./admin-service-utils";

export type CodeItem = { id: number; batchId: number; batchName: string; productId: number; productName: string; companyId: number; companyName: string; codeUuid: string; url: string; usedSum: number; usedTime: string | null };

export class CodeAdminService {
  private repository = dataSource.getRepository(Code);

  private filteredBuilder(query: CodeQueryDto) {
    const builder = this.repository.createQueryBuilder("code");
    const needsParents = Boolean(query.companyId || query.productId);
    if (needsParents) builder.innerJoin(Batches, "batch", "batch.id = code.batches_id").innerJoin(Product, "product", "product.id = batch.product_id");
    if (query.companyId) builder.andWhere("product.company_id = :companyId", { companyId: query.companyId });
    if (query.productId) builder.andWhere("product.id = :productId", { productId: query.productId });
    if (query.batchId) builder.andWhere("code.batches_id = :batchId", { batchId: query.batchId });
    if (query.codeUuid) {
      if (query.codeUuid.length === 10) builder.andWhere("code.code_uuid = :codeUuid", { codeUuid: query.codeUuid });
      else builder.andWhere("code.code_uuid LIKE :codeUuid ESCAPE '\\\\'", { codeUuid: escapeLikePrefix(query.codeUuid) });
    }
    return builder;
  }

  private map(row: any): CodeItem {
    return { id: Number(row.id), batchId: Number(row.batchId), batchName: row.batchName, productId: Number(row.productId), productName: row.productName, companyId: Number(row.companyId), companyName: row.companyName, codeUuid: row.codeUuid, url: row.url, usedSum: Number(row.usedSum ?? 0), usedTime: row.usedTime ?? null };
  }

  private async rowsByIds(ids: number[]): Promise<CodeItem[]> {
    if (!ids.length) return [];
    const rows = await this.repository.createQueryBuilder("code").innerJoin(Batches, "batch", "batch.id = code.batches_id")
      .innerJoin(Product, "product", "product.id = batch.product_id").innerJoin(Company, "company", "company.id = product.company_id")
      .select("code.id", "id").addSelect("code.batches_id", "batchId").addSelect("batch.name", "batchName")
      .addSelect("product.id", "productId").addSelect("product.name", "productName")
      .addSelect("company.id", "companyId").addSelect("company.name", "companyName")
      .addSelect("code.code_uuid", "codeUuid").addSelect("code.url", "url")
      .addSelect("code.used_sum", "usedSum").addSelect("code.used_time", "usedTime")
      .where("code.id IN (:...ids)", { ids }).getRawMany();
    const byId = new Map(rows.map((row) => [Number(row.id), this.map(row)]));
    return ids.map((id) => byId.get(id)).filter((item): item is CodeItem => Boolean(item));
  }

  async list(query: CodeQueryDto): Promise<PageData<CodeItem>> {
    const total = await this.filteredBuilder(query).getCount();
    const idRows = await this.filteredBuilder(query).select("code.id", "id").orderBy("code.id", "DESC")
      .offset((query.page - 1) * query.pageSize).limit(query.pageSize).getRawMany<{ id: string }>();
    const ids = idRows.map((row) => Number(row.id));
    return { items: await this.rowsByIds(ids), page: query.page, pageSize: query.pageSize, total };
  }

  async detail(id: number): Promise<CodeItem> {
    assertPositiveId(id);
    const [item] = await this.rowsByIds([id]);
    if (!item) throw ApiErrors.notFound("防伪码不存在");
    return item;
  }

  async create(body: CreateCodeDto): Promise<CodeItem> {
    const id = await dataSource.transaction(async (manager) => {
      const [batch] = await lockRowsById(manager, Batches, [body.batchId]);
      if (!batch) throw ApiErrors.notFound("所属批次不存在");
      const repository = manager.getRepository(Code);
      if (await repository.exist({ where: { code_uuid: body.codeUuid } })) throw ApiErrors.conflict("防伪码已存在");
      try {
        const saved = await repository.save(repository.create({ batches_id: body.batchId, code_uuid: body.codeUuid, url: body.url, used_sum: 0, used_time: null }));
        return saved.id;
      } catch (error) {
        if (isDuplicateEntry(error)) throw ApiErrors.conflict("防伪码已存在");
        throw error;
      }
    });
    return this.detail(id);
  }

  async update(id: number, body: UpdateCodeDto): Promise<CodeItem> {
    assertPositiveId(id);
    await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Code);
      const snapshot = await repository.findOneBy({ id });
      if (!snapshot) throw ApiErrors.notFound("防伪码不存在");
      const targetBatchId = body.batchId ?? snapshot.batches_id!;
      const batches = await lockRowsById(manager, Batches, [snapshot.batches_id!, targetBatchId]);
      if (!batches.some((item) => item.id === targetBatchId)) throw ApiErrors.notFound("所属批次不存在");
      const code = await repository.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!code) throw ApiErrors.notFound("防伪码不存在");
      const targetUuid = body.codeUuid ?? code.code_uuid!;
      if (await repository.createQueryBuilder("code").where("code.code_uuid = :codeUuid AND code.id <> :id", { codeUuid: targetUuid, id }).getExists()) throw ApiErrors.conflict("防伪码已存在");
      code.code_uuid = targetUuid; code.batches_id = targetBatchId;
      if (body.url !== undefined) code.url = body.url;
      try { await repository.save(code); } catch (error) {
        if (isDuplicateEntry(error)) throw ApiErrors.conflict("防伪码已存在");
        throw error;
      }
    });
    return this.detail(id);
  }

  async delete(id: number): Promise<{ id: number }> {
    assertPositiveId(id);
    return dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Code);
      const snapshot = await repository.findOneBy({ id });
      if (!snapshot) throw ApiErrors.notFound("防伪码不存在");
      await lockRowsById(manager, Batches, [snapshot.batches_id!]);
      const code = await repository.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!code) throw ApiErrors.notFound("防伪码不存在");
      await repository.remove(code); return { id };
    });
  }
}

