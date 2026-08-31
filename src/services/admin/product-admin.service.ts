import dataSource from "../../../data-source";
import { Batches } from "../../entities/batches.entity";
import { Company } from "../../entities/company.entity";
import { Product } from "../../entities/product.entity";
import type { CreateProductDto, ProductOptionsQueryDto, ProductQueryDto, UpdateProductDto } from "../../dto/admin/product.dto";
import { ApiErrors, isDuplicateEntry } from "../../errors/api-error";
import type { PageData } from "../../utils/api-response";
import { assertPositiveId, escapeLikePrefix, lockRowsById, normalizeCount } from "./admin-service-utils";

export type ProductItem = { id: number; name: string; companyId: number; companyName: string; contractImg: string | null; batchCount: number };

export class ProductAdminService {
  private repository = dataSource.getRepository(Product);

  private applyFilters(builder: ReturnType<typeof this.repository.createQueryBuilder>, query: ProductQueryDto | ProductOptionsQueryDto) {
    if ("name" in query && query.name) builder.andWhere("product.name LIKE :name ESCAPE '\\\\'", { name: escapeLikePrefix(query.name) });
    if (query.companyId) builder.andWhere("product.company_id = :companyId", { companyId: query.companyId });
  }

  async list(query: ProductQueryDto): Promise<PageData<ProductItem>> {
    const countBuilder = this.repository.createQueryBuilder("product");
    this.applyFilters(countBuilder, query);
    const total = await countBuilder.getCount();
    const builder = this.repository.createQueryBuilder("product")
      .innerJoin(Company, "company", "company.id = product.company_id")
      .select("product.id", "id").addSelect("product.name", "name")
      .addSelect("product.company_id", "companyId").addSelect("company.name", "companyName")
      .addSelect("product.contract_img", "contractImg");
    this.applyFilters(builder, query);
    const rows = await builder.orderBy("product.id", "DESC").offset((query.page - 1) * query.pageSize).limit(query.pageSize)
      .getRawMany<{ id: string; name: string; companyId: string; companyName: string; contractImg: string | null }>();
    const counts = new Map<number, number>();
    if (rows.length) {
      const countRows = await dataSource.getRepository(Batches).createQueryBuilder("batch")
        .select("batch.product_id", "productId").addSelect("COUNT(*)", "count")
        .where("batch.product_id IN (:...ids)", { ids: rows.map((row) => Number(row.id)) })
        .groupBy("batch.product_id").getRawMany<{ productId: string; count: string }>();
      countRows.forEach((row) => counts.set(Number(row.productId), normalizeCount(row.count)));
    }
    return { items: rows.map((row) => ({ id: Number(row.id), name: row.name, companyId: Number(row.companyId), companyName: row.companyName, contractImg: row.contractImg, batchCount: counts.get(Number(row.id)) ?? 0 })), page: query.page, pageSize: query.pageSize, total };
  }

  async options(query: ProductOptionsQueryDto) {
    const builder = this.repository.createQueryBuilder("product")
      .innerJoin(Company, "company", "company.id = product.company_id")
      .select("product.id", "id").addSelect("product.name", "name")
      .addSelect("product.company_id", "companyId").addSelect("company.name", "companyName");
    if (query.keyword) builder.andWhere("product.name LIKE :keyword ESCAPE '\\\\'", { keyword: escapeLikePrefix(query.keyword) });
    if (query.companyId) builder.andWhere("product.company_id = :companyId", { companyId: query.companyId });
    return (await builder.orderBy("product.id", "DESC").limit(query.limit).getRawMany()).map((row) => ({ id: Number(row.id), name: row.name, companyId: Number(row.companyId), companyName: row.companyName }));
  }

  async detail(id: number): Promise<ProductItem> {
    assertPositiveId(id);
    const row = await this.repository.createQueryBuilder("product").innerJoin(Company, "company", "company.id = product.company_id")
      .select("product.id", "id").addSelect("product.name", "name").addSelect("product.company_id", "companyId")
      .addSelect("company.name", "companyName").addSelect("product.contract_img", "contractImg")
      .where("product.id = :id", { id }).getRawOne();
    if (!row) throw ApiErrors.notFound("产品不存在");
    const batchCount = await dataSource.getRepository(Batches).countBy({ product_id: id });
    return { id: Number(row.id), name: row.name, companyId: Number(row.companyId), companyName: row.companyName, contractImg: row.contractImg, batchCount };
  }

  async create(body: CreateProductDto): Promise<ProductItem> {
    const id = await dataSource.transaction(async (manager) => {
      const [company] = await lockRowsById(manager, Company, [body.companyId]);
      if (!company) throw ApiErrors.notFound("所属公司不存在");
      const repository = manager.getRepository(Product);
      if (await repository.exist({ where: { company_id: body.companyId, name: body.name } })) throw ApiErrors.conflict("同一公司下产品名称已存在");
      try {
        const saved = await repository.save(repository.create({ name: body.name, company_id: body.companyId, contract_img: body.contractImg ?? null, serial_number: null }));
        return saved.id;
      } catch (error) {
        if (isDuplicateEntry(error)) throw ApiErrors.conflict("同一公司下产品名称已存在");
        throw error;
      }
    });
    return this.detail(id);
  }

  async update(id: number, body: UpdateProductDto): Promise<ProductItem> {
    assertPositiveId(id);
    await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Product);
      const snapshot = await repository.findOneBy({ id });
      if (!snapshot) throw ApiErrors.notFound("产品不存在");
      const targetCompanyId = body.companyId ?? snapshot.company_id!;
      const companies = await lockRowsById(manager, Company, [snapshot.company_id!, targetCompanyId]);
      if (!companies.some((item) => item.id === targetCompanyId)) throw ApiErrors.notFound("所属公司不存在");
      const product = await repository.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!product) throw ApiErrors.notFound("产品不存在");
      const targetName = body.name ?? product.name!;
      if (await repository.createQueryBuilder("product").where("product.company_id = :companyId AND product.name = :name AND product.id <> :id", { companyId: targetCompanyId, name: targetName, id }).getExists()) {
        throw ApiErrors.conflict("同一公司下产品名称已存在");
      }
      product.name = targetName;
      product.company_id = targetCompanyId;
      if (body.contractImg !== undefined) product.contract_img = body.contractImg;
      try { await repository.save(product); } catch (error) {
        if (isDuplicateEntry(error)) throw ApiErrors.conflict("同一公司下产品名称已存在");
        throw error;
      }
    });
    return this.detail(id);
  }

  async delete(id: number): Promise<{ id: number }> {
    assertPositiveId(id);
    return dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Product);
      const snapshot = await repository.findOneBy({ id });
      if (!snapshot) throw ApiErrors.notFound("产品不存在");
      await lockRowsById(manager, Company, [snapshot.company_id!]);
      const product = await repository.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!product) throw ApiErrors.notFound("产品不存在");
      if (await manager.getRepository(Batches).exist({ where: { product_id: id } })) throw ApiErrors.dependencyExists("产品下存在关联批次，不能删除");
      await repository.remove(product);
      return { id };
    });
  }
}

