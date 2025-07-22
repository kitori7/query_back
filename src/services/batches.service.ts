/**
 * 批次类
 */
import { Batches } from "../entities/batches.entity";
import { Code } from "../entities/code.entity";
import shortUUID from "short-uuid";
import AppDataSource from "../../data-source";
import { Product } from "../entities/product.entity";
import dayjs from "dayjs";

export class BatchService {
  private translator = shortUUID();

  private batchRepository = AppDataSource.getRepository(Batches);
  private codeRepository = AppDataSource.getRepository(Code);
  private productRepository = AppDataSource.getRepository(Product);

  // 根据数量生产 codes
  createCodes(batchId: number, codeCount: number) {
    const codes = [];
    for (let i = 0; i < codeCount; i++) {
      const code = new Code();
      code.batches_id = batchId;
      code.used_sum = 0;
      const uuid = this.translator.new().slice(0, 10);
      code.code_uuid = uuid;
      code.url = `http://www.jyygds.com/?uuid=${uuid}`;
      codes.push(code);
    }
    return codes;
  }

  async createBatch(
    productId: number,
    batchName: string,
    codeCount: number
  ): Promise<Batches> {
    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new Error("未找到产品");
    }
    const batch = new Batches();
    batch.name = batchName;
    batch.product_id = productId;
    batch.create_time = dayjs(new Date()).format("YYYY-MM-DD hh:mm:ss");

    const savedBatch = await this.batchRepository.save(batch);

    const codes = this.createCodes(savedBatch.id, codeCount);
    await this.codeRepository.save(codes);

    return savedBatch;
  }

  // 在已有批次中新增校验码
  async applyBatch(batchId: number, codeCount: number) {
    const batch = await this.batchRepository.findOneBy({ id: batchId });
    if (!batch) {
      throw new Error("未找到批次");
    }
    const codes = this.createCodes(batchId, codeCount);
    await this.codeRepository.save(codes);

    return batch;
  }
}
