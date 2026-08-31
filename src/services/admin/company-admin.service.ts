import dataSource from "../../../data-source";
import { Company } from "../../entities/company.entity";
import { Product } from "../../entities/product.entity";
import type { CompanyQueryDto, CreateCompanyDto, UpdateCompanyDto } from "../../dto/admin/company.dto";
import type { OptionsQueryDto } from "../../dto/admin/common.dto";
import { ApiErrors, isDuplicateEntry } from "../../errors/api-error";
import type { PageData } from "../../utils/api-response";
import { assertPositiveId, escapeLikePrefix, normalizeCount } from "./admin-service-utils";

export type CompanyItem = { id: number; name: string; productCount: number };

export class CompanyAdminService {
  private repository = dataSource.getRepository(Company);

  async list(query: CompanyQueryDto): Promise<PageData<CompanyItem>> {
    const builder = this.repository.createQueryBuilder("company");
    if (query.name) builder.where("company.name LIKE :name ESCAPE '\\\\'", { name: escapeLikePrefix(query.name) });
    builder.orderBy("company.id", "DESC").skip((query.page - 1) * query.pageSize).take(query.pageSize);
    const [companies, total] = await builder.getManyAndCount();
    const counts = new Map<number, number>();
    if (companies.length) {
      const rows = await dataSource.getRepository(Product).createQueryBuilder("product")
        .select("product.company_id", "companyId").addSelect("COUNT(*)", "count")
        .where("product.company_id IN (:...ids)", { ids: companies.map((item) => item.id) })
        .groupBy("product.company_id").getRawMany<{ companyId: string; count: string }>();
      rows.forEach((row) => counts.set(Number(row.companyId), normalizeCount(row.count)));
    }
    return { items: companies.map((item) => ({ id: item.id, name: item.name!, productCount: counts.get(item.id) ?? 0 })), page: query.page, pageSize: query.pageSize, total };
  }

  async options(query: OptionsQueryDto) {
    const builder = this.repository.createQueryBuilder("company").select(["company.id", "company.name"]);
    if (query.keyword) builder.where("company.name LIKE :keyword ESCAPE '\\\\'", { keyword: escapeLikePrefix(query.keyword) });
    const rows = await builder.orderBy("company.id", "DESC").take(query.limit).getMany();
    return rows.map((item) => ({ id: item.id, name: item.name! }));
  }

  async detail(id: number): Promise<CompanyItem> {
    assertPositiveId(id);
    const company = await this.repository.findOneBy({ id });
    if (!company) throw ApiErrors.notFound("公司不存在");
    const productCount = await dataSource.getRepository(Product).countBy({ company_id: id });
    return { id: company.id, name: company.name!, productCount };
  }

  async create(body: CreateCompanyDto): Promise<CompanyItem> {
    if (await this.repository.exist({ where: { name: body.name } })) throw ApiErrors.conflict("公司名称已存在");
    try {
      const saved = await this.repository.save(this.repository.create({ name: body.name }));
      return { id: saved.id, name: saved.name!, productCount: 0 };
    } catch (error) {
      if (isDuplicateEntry(error)) throw ApiErrors.conflict("公司名称已存在");
      throw error;
    }
  }

  async update(id: number, body: UpdateCompanyDto): Promise<CompanyItem> {
    assertPositiveId(id);
    return dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Company);
      const company = await repository.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!company) throw ApiErrors.notFound("公司不存在");
      if (await repository.createQueryBuilder("company").where("company.name = :name AND company.id <> :id", { name: body.name, id }).getExists()) {
        throw ApiErrors.conflict("公司名称已存在");
      }
      company.name = body.name;
      try { await repository.save(company); } catch (error) {
        if (isDuplicateEntry(error)) throw ApiErrors.conflict("公司名称已存在");
        throw error;
      }
      const productCount = await manager.getRepository(Product).countBy({ company_id: id });
      return { id, name: company.name, productCount };
    });
  }

  async delete(id: number): Promise<{ id: number }> {
    assertPositiveId(id);
    return dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Company);
      const company = await repository.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!company) throw ApiErrors.notFound("公司不存在");
      if (await manager.getRepository(Product).exist({ where: { company_id: id } })) {
        throw ApiErrors.dependencyExists("公司下存在关联产品，不能删除");
      }
      await repository.remove(company);
      return { id };
    });
  }
}

