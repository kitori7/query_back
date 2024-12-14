/**
 * 校验码 controller
 */
import { Controller, Get, Param } from "routing-controllers";
import { CodeService } from "../services/code.service";

@Controller("/api/code")
export class codeController {
  codeService;
  constructor() {
    this.codeService = new CodeService();
  }
  //查询全部校验码
  @Get("/queryList")
  queryList() {
    return this.codeService.queryList();
  }

  // 根据校验码获取详情
  @Get("/:uuid")
  async detailByCode(@Param("uuid") uuid: string) {
    try {
      const result = await this.codeService.getDetailByUUid(uuid);
      return {
        code: 200,
        data: result,
        msg: "获取成功",
      };
    } catch (error) {
      return {
        code: -1,
        data: false,
        msg: "不存在的校验码",
      };
    }
  }
}
