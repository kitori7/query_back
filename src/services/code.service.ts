/**
 * 防伪码类
 */
import db from "../../data-source";
import { Batches } from "../entities/batches.entity";
import { Code } from "../entities/code.entity";
import { Company } from "../entities/company.entity";
import { Product } from "../entities/product.entity";
import dayjs from "dayjs";

export class CodeService {
  private CodeRepository = db.getRepository(Code);
  private BatchRepository = db.getRepository(Batches);
  private ProductRepository = db.getRepository(Product);
  private CompanyRepository = db.getRepository(Company);
  // 查询全部状态码
  async queryList() {
    return await this.CodeRepository.findAndCount();
  }

  async getDetailByUUid(uuid: string) {
    // 查找代码记录
    const code = await this.CodeRepository.findOneBy({ code_uuid: uuid });
    if (!code) {
      throw new Error(`Code with UUID ${uuid} not found`);
    }

    // 查找批次记录
    const batch = await this.BatchRepository.findOneBy({
      id: code.batches_id,
    });
    if (!batch) {
      throw new Error(`Batch with ID ${code.batches_id} not found`);
    }

    // 查找产品记录
    const product = await this.ProductRepository.findOneBy({
      id: batch.product_id,
    });
    if (!product) {
      throw new Error(`Product with ID ${batch.product_id} not found`);
    }

    // 查找公司记录
    const company = await this.CompanyRepository.findOneBy({
      id: product.company_id,
    });
    if (!company) {
      throw new Error(`Company with ID ${product.company_id} not found`);
    }

    // 判断是否是第一次使用
    const isFirst = code.used_sum === 0;

    // 更新使用时间和使用次数
    if (code.used_sum === 1) {
      code.used_time = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
    }
    code.used_sum++;
    await this.CodeRepository.save(code);

    // 返回结果
    return {
      isFirst,
      usedSum: code.used_sum - 1,
      usedTime: code.used_time,
      batchName: batch.name,
      productName: product.name,
      companyName: company.name,
      imgUrl: batch.img_url,
    };
  }
}
