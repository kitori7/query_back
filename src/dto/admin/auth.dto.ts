import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";
import { trim } from "./common.dto";

export class LoginDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password!: string;
}

