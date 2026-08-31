import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength, ValidateIf } from "class-validator";
import { OptionsQueryDto, PageQueryDto, trim } from "./common.dto";

const nullableUrl = ({ value }: { value: unknown }): unknown => typeof value === "string" && value.trim() === "" ? null : value;
export class ProductQueryDto extends PageQueryDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) companyId?: number;
}
export class ProductOptionsQueryDto extends OptionsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) companyId?: number;
}
export class CreateProductDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) name!: string;
  @Type(() => Number) @IsInt() @Min(1) companyId!: number;
  @IsOptional() @Transform(nullableUrl) @ValidateIf((_o, value) => value !== null) @IsUrl({ protocols: ["http", "https"], require_protocol: true }) contractImg?: string | null;
}
export class UpdateProductDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(255) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) companyId?: number;
  @IsOptional() @Transform(nullableUrl) @ValidateIf((_o, value) => value !== null) @IsUrl({ protocols: ["http", "https"], require_protocol: true }) contractImg?: string | null;
}

