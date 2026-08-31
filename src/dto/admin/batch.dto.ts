import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from "class-validator";
import { OptionsQueryDto, PageQueryDto, trim } from "./common.dto";

export class BatchQueryDto extends PageQueryDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) companyId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) productId?: number;
}
export class BatchOptionsQueryDto extends OptionsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) companyId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) productId?: number;
}
export class CreateBatchDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) name!: string;
  @Type(() => Number) @IsInt() @Min(1) productId!: number;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUrl({ protocols: ["http", "https"], require_protocol: true }, { each: true }) imgUrls?: string[];
}
export class UpdateBatchDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) productId?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUrl({ protocols: ["http", "https"], require_protocol: true }, { each: true }) imgUrls?: string[];
}
export class LegacyCreateBatchDto {
  @Type(() => Number) @IsInt() @Min(1) productId!: number;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) batchName!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) codeCount!: number;
}
export class LegacyApplyBatchDto {
  @Type(() => Number) @IsInt() @Min(1) batchId!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) codeCount!: number;
}

