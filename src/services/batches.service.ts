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
  private batchRepository = AppDataSource.getRepository(Batches);
  private codeRepository = AppDataSource.getRepository(Code);
  private productRepository = AppDataSource.getRepository(Product);

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

    const codes = [];
    for (let i = 0; i < codeCount; i++) {
      const code = new Code();
      code.batches_id = savedBatch.id;
      code.used_sum = 0;
      const translator = shortUUID();
      const uuid = translator.new().slice(0, 10);
      code.code_uuid = uuid;
      code.url = `http://www.jyygds.com/?uuid=${uuid}`;
      // axios.get(
      //   "https://open-api.cli.im/cli-open-platform-service/v1/labelStyle/createWithKey",
      //   {
      //     params: {
      //       cliT: "D1",
      //       api_key: "CL97462eb2bf4e0bd7",
      //       cliD: `http://www.jyygds.com/?uuid=${uuid}`,
      //       cliF1: "",
      //     },
      //   }
      // );
      codes.push(code);
    }
    await this.codeRepository.save(codes);

    return savedBatch;
  }
}
