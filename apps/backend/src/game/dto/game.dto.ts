import { Categories, Game, GameConfig, GameMode, GameState, GameStatus, Guess, GuessObject, Player, PlayerResults, Result, Round, RoundStatus } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { GuessObjectDto } from "src/guess-object/dto/guess-object.dto";
import { PlayerDto } from "src/player/dto/player.dto";

export class GameDto implements Game {
    @IsString()
    id: string;

    @IsString()
    hostID: string;

    @IsEnum(GameMode)
    mode: GameMode;

    @IsEnum(GameStatus)
    status: GameStatus;

    @ValidateNested()
    @Type(() => GameConfigDto)
    gameConfig: GameConfigDto;

    @ValidateNested()
    @Type(() => PlayerDto)
    players: PlayerDto[];

    @ValidateNested()
    @Type(() => GameStateDto)
    state: GameStateDto;
}

export class GameConfigDto implements GameConfig {
    @IsArray()
    @IsEnum(Categories, { each: true })
    categories: Categories[];

    @IsNumber()
    timer: number;

    @IsNumber()
    nbOfObjects: number;
}

export class GameStateDto implements GameState {
    @IsArray()
    @IsString({ each: true })
    guessObjectsIds: string[];

    @IsOptional()
    @Type(() => RoundDto)
    currentRound: RoundDto | undefined;

    @IsOptional()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => PlayerResultsDto)
    results: Record<string, PlayerResultsDto>;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GuessObjectDto)
    guessObjects?: GuessObjectDto[] | undefined;
}

export class RoundDto implements Round {
    @IsEnum(RoundStatus)
    status: RoundStatus;

    @IsString()
    guessObjectId: string;

    @IsOptional()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => GuessDto)
    playersGuesses?: Record<string, GuessDto> | undefined;

}

export interface Coord {
    lat: number;
    lng: number;
}

export class CoordDto {
    @IsNumber()
    lat: number;

    @IsNumber()
    lng: number;
}

export class GuessDto implements Guess {
    @ValidateNested()
    @Type(() => CoordDto)
    coordinates: CoordDto;

    @IsNumber()
    distance: number;

    @IsNumber()
    points: number;

    @IsBoolean()
    win: boolean;
}

export class PlayerResultsDto implements PlayerResults {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ResultDto)
    results: ResultDto[];
}


class ResultDto implements Result {
    @IsString()
    guessObjectId: string;

    @IsNumber()
    distance: number;

    @IsNumber()
    points: number;
}