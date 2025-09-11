import { GameRecord as PrismaGameRecord } from "@prisma/client";
import { GameRecordDto, PlayerResultsDto } from "./dto/game.dto";
import { GameConfig, SessionMode } from "@cityborn/types";
import { PlayerDto } from "src/player/dto/player.dto";
import { GameConfigDto } from "./dto/session.dto";

export class GameMapper {
    static toGameRecordDto(gameRecords: PrismaGameRecord[]): GameRecordDto[] {
        return gameRecords.map(record => ({
            id: record.id,
            mode: record.mode as SessionMode,
            gameConfig: record.gameConfig as unknown as GameConfigDto,
            players: record.players as unknown as PlayerDto[],
            guessObjectsIds: record.guessObjectsIds,
            results: record.results as unknown as Record<string, PlayerResultsDto>,
            createdAt: record.createdAt.toISOString().split('T')[0]
        }));
    }
}