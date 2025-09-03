import { Coord, Game, GameState, GameStatus, Guess, PlayerResults, Result, Round, RoundStatus } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { GuessObjectDto } from "src/guess-object/dto/guess-object.dto";

export class ResultDto implements Result {
    @IsString()
    guessObjectId: string;

    @IsNumber()
    distance: number;

    @IsNumber()
    points: number;
}

export class PlayerResultsDto implements PlayerResults {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ResultDto)
    results: ResultDto[];
}

export class CoordDto implements Coord {
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

export class GameStateDto implements GameState {
    @IsArray()
    @IsString({ each: true })
    guessObjectsIds: string[];

    @IsOptional()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => PlayerResultsDto)
    results: Record<string, PlayerResultsDto>;

    @IsOptional()
    @Type(() => RoundDto)
    currentRound?: RoundDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GuessObjectDto)
    guessObjects?: GuessObjectDto[] | undefined;
}

export class GameDto implements Game {
    @IsString()
    id: string;

    @IsEnum(GameStatus)
    status: GameStatus;

    @ValidateNested()
    @Type(() => GameStateDto)
    state: GameStateDto;
}