import { Player } from "@cityborn/types";
import { IsBoolean, IsString } from "class-validator";

export class PlayerDto implements Player {

    @IsString()
    id: string;

    @IsBoolean()
    isGuest: boolean;
}