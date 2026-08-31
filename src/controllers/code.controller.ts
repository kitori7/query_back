/**
 * 校验码 controller
 */
import { Authorized, Controller, Get, Param } from "routing-controllers";
import { CodeService } from "../services/code.service";
import { ApiErrors } from "../errors/api-error";

@Controller("/api/code")
export class codeController {
  codeService;
  constructor() {
    this.codeService = new CodeService();
  }
  //查询全部校验码
  @Get("/queryList")
  @Authorized("ADMIN")
  queryList() {
    throw ApiErrors.deprecated("该接口已停用，请使用 /api/admin/codes");
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
