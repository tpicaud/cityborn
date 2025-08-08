import { GameConfig, GameMode, Session, SessionStatus } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { GameConfigDto } from "src/game/dto/game.dto";
import { PlayerDto } from "src/player/dto/player.dto";

export class SessionDto implements Session {
    @IsString()
    id: string;

    @IsString()
    hostID: string;

    @IsEnum(GameMode)
    mode: GameMode;

    @IsEnum(SessionStatus)
    status: SessionStatus;

    @ValidateNested()
    @Type(() => GameConfigDto)
    gameConfig: GameConfigDto;

    @IsArray()
    @Type(() => PlayerDto)
    players: PlayerDto[];

    @IsOptional()
    @IsString()
    currentGameId?: string;
}