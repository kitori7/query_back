import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUrl, Length, MaxLength, Min, MinLength } from "class-validator";
import { PageQueryDto, trim } from "./common.dto";

export class CodeQueryDto extends PageQueryDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(10) codeUuid?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) companyId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) productId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) batchId?: number;
}
export class CreateCodeDto {
  @Transform(trim) @IsString() @Length(10, 10) codeUuid!: string;
  @Transform(trim) @IsUrl({ protocols: ["http", "https"], require_protocol: true }) url!: string;
  @Type(() => Number) @IsInt() @Min(1) batchId!: number;
}
export class UpdateCodeDto {
  @IsOptional() @Transform(trim) @IsString() @Length(10, 10) codeUuid?: string;
  @IsOptional() @Transform(trim) @IsUrl({ protocols: ["http", "https"], require_protocol: true }) url?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) batchId?: number;
}
