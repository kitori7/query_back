import dataSource from "../../../data-source";
import { Batches } from "../../entities/batches.entity";
import { Code } from "../../entities/code.entity";
import { Company } from "../../entities/company.entity";
import { Product } from "../../entities/product.entity";
import type { BatchOptionsQueryDto, BatchQueryDto, CreateBatchDto, UpdateBatchDto } from "../../dto/admin/batch.dto";
import { ApiErrors, isDuplicateEntry } from "../../errors/api-error";
import type { PageData } from "../../utils/api-response";
import { assertPositiveId, escapeLikePrefix, lockRowsById, normalizeCount } from "./admin-service-utils";

export type BatchItem = { id: number; name: string; createTime: string | null; productId: number; productName: string; companyId: number; companyName: string; imgUrls: string[]; codeCount: number };

function imgUrls(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
  }
  return [];
}

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export class BatchAdminService {
  private repository = dataSource.getRepository(Batches);

  private joinedBuilder() {
    return this.repository.createQueryBuilder("batch")
      .innerJoin(Product, "product", "product.id = batch.product_id")
      .innerJoin(Company, "company", "company.id = product.company_id");
  }

  private filters(builder: ReturnType<BatchAdminService["joinedBuilder"]>, query: BatchQueryDto | BatchOptionsQueryDto) {
    if ("name" in query && query.name) builder.andWhere("batch.name LIKE :name ESCAPE '\\\\'", { name: escapeLikePrefix(query.name) });
    if (query.companyId) builder.andWhere("company.id = :companyId", { companyId: query.companyId });
    if (query.productId) builder.andWhere("product.id = :productId", { productId: query.productId });
  }

  private map(row: any, count = 0): BatchItem {
    return { id: Number(row.id), name: row.name, createTime: iso(row.createTime), productId: Number(row.productId), productName: row.productName, companyId: Number(row.companyId), companyName: row.companyName, imgUrls: imgUrls(row.imgUrls), codeCount: count };
  }

  async list(query: BatchQueryDto): Promise<PageData<BatchItem>> {
    const countBuilder = this.joinedBuilder(); this.filters(countBuilder, query);
    const total = await countBuilder.getCount();
    const builder = this.joinedBuilder().select("batch.id", "id").addSelect("batch.name", "name")
      .addSelect("batch.create_time", "createTime").addSelect("batch.product_id", "productId")
      .addSelect("product.name", "productName").addSelect("company.id", "companyId")
      .addSelect("company.name", "companyName").addSelect("batch.img_url", "imgUrls");
    this.filters(builder, query);
    const rows = await builder.orderBy("batch.id", "DESC").offset((query.page - 1) * query.pageSize).limit(query.pageSize).getRawMany();
    const counts = new Map<number, number>();
    if (rows.length) {
      const countRows = await dataSource.getRepository(Code).createQueryBuilder("code").select("code.batches_id", "batchId").addSelect("COUNT(*)", "count")
        .where("code.batches_id IN (:...ids)", { ids: rows.map((row) => Number(row.id)) }).groupBy("code.batches_id").getRawMany<{ batchId: string; count: string }>();
      countRows.forEach((row) => counts.set(Number(row.batchId), normalizeCount(row.count)));
    }
    return { items: rows.map((row) => this.map(row, counts.get(Number(row.id)) ?? 0)), page: query.page, pageSize: query.pageSize, total };
  }

  async options(query: BatchOptionsQueryDto) {
    const builder = this.joinedBuilder().select("batch.id", "id").addSelect("batch.name", "name")
      .addSelect("product.id", "productId").addSelect("product.name", "productName")
      .addSelect("company.id", "companyId").addSelect("company.name", "companyName");
    if (query.keyword) builder.andWhere("batch.name LIKE :keyword ESCAPE '\\\\'", { keyword: escapeLikePrefix(query.keyword) });
    if (query.companyId) builder.andWhere("company.id = :companyId", { companyId: query.companyId });
    if (query.productId) builder.andWhere("product.id = :productId", { productId: query.productId });
    return (await builder.orderBy("batch.id", "DESC").limit(query.limit).getRawMany()).map((row) => ({ id: Number(row.id), name: row.name, productId: Number(row.productId), productName: row.productName, companyId: Number(row.companyId), companyName: row.companyName }));
  }

  async detail(id: number): Promise<BatchItem> {
    assertPositiveId(id);
    const row = await this.joinedBuilder().select("batch.id", "id").addSelect("batch.name", "name").addSelect("batch.create_time", "createTime")
      .addSelect("batch.product_id", "productId").addSelect("product.name", "productName").addSelect("company.id", "companyId")
      .addSelect("company.name", "companyName").addSelect("batch.img_url", "imgUrls").where("batch.id = :id", { id }).getRawOne();
    if (!row) throw ApiErrors.notFound("批次不存在");
    return this.map(row, await dataSource.getRepository(Code).countBy({ batches_id: id }));
  }

  async create(body: CreateBatchDto): Promise<BatchItem> {
    const id = await dataSource.transaction(async (manager) => {
      const [product] = await lockRowsById(manager, Product, [body.productId]);
      if (!product) throw ApiErrors.notFound("所属产品不存在");
      const repository = manager.getRepository(Batches);
      if (await repository.exist({ where: { product_id: body.productId, name: body.name } })) throw ApiErrors.conflict("同一产品下批次名称已存在");
      try {
        const saved = await repository.save(repository.create({ name: body.name, product_id: body.productId, img_url: body.imgUrls ?? [], create_time: new Date(), uniqueness_enforced: 1 }));
        return saved.id;
      } catch (error) {
        if (isDuplicateEntry(error)) throw ApiErrors.conflict("同一产品下批次名称已存在");
        throw error;
      }
    });
    return this.detail(id);
  }

  async update(id: number, body: UpdateBatchDto): Promise<BatchItem> {
    assertPositiveId(id);
    await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Batches);
      const snapshot = await repository.findOneBy({ id });
      if (!snapshot) throw ApiErrors.notFound("批次不存在");
      const targetProductId = body.productId ?? snapshot.product_id!;
      const products = await lockRowsById(manager, Product, [snapshot.product_id!, targetProductId]);
      if (!products.some((item) => item.id === targetProductId)) throw ApiErrors.notFound("所属产品不存在");
      const batch = await repository.createQueryBuilder("batch").addSelect("batch.uniqueness_enforced").setLock("pessimistic_write").where("batch.id = :id", { id }).getOne();
      if (!batch) throw ApiErrors.notFound("批次不存在");
      const targetName = body.name ?? batch.name!;
      if (await repository.createQueryBuilder("batch").where("batch.product_id = :productId AND batch.name = :name AND batch.id <> :id", { productId: targetProductId, name: targetName, id }).getExists()) {
        throw ApiErrors.conflict("同一产品下批次名称已存在");
      }
      batch.name = targetName; batch.product_id = targetProductId; batch.uniqueness_enforced = 1;
      if (body.imgUrls !== undefined) batch.img_url = body.imgUrls;
      try { await repository.save(batch); } catch (error) {
        if (isDuplicateEntry(error)) throw ApiErrors.conflict("同一产品下批次名称已存在");
        throw error;
      }
    });
    return this.detail(id);
  }

  async delete(id: number): Promise<{ id: number }> {
    assertPositiveId(id);
    return dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Batches);
      const snapshot = await repository.findOneBy({ id });
      if (!snapshot) throw ApiErrors.notFound("批次不存在");
      await lockRowsById(manager, Product, [snapshot.product_id!]);
      const batch = await repository.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!batch) throw ApiErrors.notFound("批次不存在");
      if (await manager.getRepository(Code).exist({ where: { batches_id: id } })) throw ApiErrors.dependencyExists("批次下存在防伪码，不能删除");
      await repository.remove(batch); return { id };
    });
  }
}

