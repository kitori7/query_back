// src/controllers/batch.controller.ts
import { Authorized, Controller, Post, Body } from "routing-controllers";
import { BatchService } from "../services/batches.service";
import { LegacyApplyBatchDto, LegacyCreateBatchDto } from "../dto/admin/batch.dto";

@Controller("/api/batch")
export class BatchController {
  private batchService = new BatchService();

  @Post("/create")
  @Authorized("ADMIN")
  async createBatch(@Body() body: LegacyCreateBatchDto) {
    const { productId, batchName, codeCount } = body;
    await this.batchService.createBatch(productId, batchName, codeCount);
    return { code: 200, data: true, msg: "添加成功" };
  }

  @Post("/apply")
  @Authorized("ADMIN")
  async applyBatch(@Body() body: LegacyApplyBatchDto) {
    const { batchId, codeCount } = body;
    const data = await this.batchService.applyBatch(batchId, codeCount);
    return {
      code: 200,
      data: true,
      msg: "添加成功",
    };
  }

}
