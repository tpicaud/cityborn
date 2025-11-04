import { GameConfig, SessionMode, Session, SessionStatus, Coord } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { PlayerDto } from "src/player/dto/player.dto";
import { GameDto } from "./game.dto";
import { CategoryDto } from "src/category/dto/category.dto";

export class GameConfigDto implements GameConfig {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryDto)
    categories: CategoryDto[];

    @IsNumber()
    timer: number;

    @IsNumber()
    nbOfObjects: number;
}

export class CoordDto implements Coord {
    @IsNumber()
    lat: number;

    @IsNumber()
    lng: number;
}

export class SessionDto implements Session {
    @IsUUID()
    @IsString()
    id: string;

    @IsString()
    hostID: string;

    @IsEnum(SessionMode)
    mode: SessionMode;

    @IsEnum(SessionStatus)
    status: SessionStatus;

    @ValidateNested()
    @Type(() => GameConfigDto)
    gameConfig: GameConfigDto;

    @IsArray()
    @Type(() => PlayerDto)
    players: PlayerDto[];

    @IsOptional()
    @Type(() => GameDto)
    currentGame?: GameDto;
}