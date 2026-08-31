import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { OptionsQueryDto, PageQueryDto, trim } from "./common.dto";

export class CompanyQueryDto extends PageQueryDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(255)
  name?: string;
}
export class CompanyOptionsQueryDto extends OptionsQueryDto {}
export class CreateCompanyDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(255)
  name!: string;
}
export class UpdateCompanyDto extends CreateCompanyDto {}

