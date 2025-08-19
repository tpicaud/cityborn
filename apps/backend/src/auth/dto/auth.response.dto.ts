import { PublicUser } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsString } from "class-validator";
import { PublicUserDto } from "src/user/dto/public-user.dto";

export class AuthResponseDto {
    @IsString()
    access_token: string;

    @Type(() => PublicUserDto)
    user: PublicUserDto;
}