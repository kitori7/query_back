// src/controllers/batch.controller.ts
import { Controller, Post, Body } from "routing-controllers";
import { BatchService } from "../services/batches.service";

@Controller("/api/batch")
export class BatchController {
  private batchService = new BatchService();

  @Post("/create")
  async createBatch(
    @Body() body: { productId: number; batchName: string; codeCount: number }
  ) {
    const { productId, batchName, codeCount } = body;
    try {
      const data = await this.batchService.createBatch(
        productId,
        batchName,
        codeCount
      );
      return {
        code: 200,
        data: true,
        msg: "添加成功",
      };
    } catch (error) {
      console.log(error);

      return {
        code: -1,
        data: false,
        msg: "未找到产品",
      };
    }
  }

  @Post("/apply")
  async applyBatch(@Body() body: { batchId: number; codeCount: number }) {
    const { batchId, codeCount } = body;
    const data = await this.batchService.applyBatch(batchId, codeCount);
    return {
      code: 200,
      data: true,
      msg: "添加成功",
    };
  }
}
