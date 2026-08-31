import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { ApiErrors } from "../../errors/api-error";

export const trim = ({ value }: { value: unknown }): unknown => typeof value === "string" ? value.trim() : value;

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class OptionsQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export function assertNonEmptyPatch(value: object): void {
  if (!Object.values(value).some((item) => item !== undefined)) {
    throw ApiErrors.invalid("至少需要提交一个可修改字段");
  }
}

