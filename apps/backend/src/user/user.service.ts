import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCode } from '@cityborn/errors';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { GameRecordsResponseDto } from 'src/session/dto/game.response.dto';
import { GameMapper } from 'src/session/game.mapper';
import { GameRecordDto } from 'src/session/dto/game.dto';
import { SessionMode } from '@cityborn/types';
import { CreateGameRecordDto } from 'src/session/dto/create-game.dto';

@Injectable()
export class UserService {

    constructor(
        private readonly prisma: PrismaService
    ) { }

    async createUser(
        data: {
            email: string;
            username: string;
            isVerified?: boolean,
            password?: string,
            birthdate?: string
        }): Promise<PrismaUser> {
        return await this.prisma.user.create({ data });
    }

    async findByIdentifier(identifier: string): Promise<PrismaUser | null> {
        return await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        })
    }

    async findById(id: number): Promise<PrismaUser | null> {
        return await this.prisma.user.findUnique({ where: { id } });
    }

    async validateIdentifiers(username: string, email: string): Promise<void> {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        });

        if (!existingUser) return;

        if (existingUser.username === username) {
            throw new ConflictException({ code: ErrorCode.USER_USERNAME_ALREADY_EXISTS, message: 'Username already exists' });
        }

        if (existingUser.email === email) {
            throw new ConflictException({ code: ErrorCode.USER_EMAIL_ALREADY_TAKEN, message: 'Email already taken' });
        }
    }


    ///////////////
    // Relations //
    ///////////////
    async getGameRecords(user_id: number): Promise<GameRecordsResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: user_id },
            include: {
                gameRecords: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!user) throw new UnauthorizedException({ code: ErrorCode.USER_INVALID_CREDENTIALS, message: `Invalid credentials` });

        return { gameRecords: GameMapper.toGameRecordDto(user.gameRecords) };
    }

    async saveSoloGameRecord(user_id: number, createGameRecord: CreateGameRecordDto): Promise<void> {
        if (createGameRecord.mode !== SessionMode.SOLO) {
            throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Cannot save game with this gameMode' })
        }

        await this.prisma.gameRecord.create({
            data: {
                mode: createGameRecord.mode,
                gameConfig: createGameRecord.gameConfig as unknown as Prisma.InputJsonValue,
                players: createGameRecord.players as unknown as Prisma.InputJsonValue,
                guessObjectsIds: createGameRecord.guessObjectsIds,
                results: createGameRecord.results as unknown as Prisma.InputJsonValue,
                users: {
                    connect: { id: user_id }
                }
            }
        });
    }


    ////////////////////////
    // Email verification //
    ////////////////////////
    async createVerificationToken(user: PrismaUser): Promise<string> {
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await this.prisma.emailVerificationToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        return token;
    }

    async verifyEmail(token: string) {
        const record = await this.prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!record || record.expiresAt < new Date()) {
            throw new UnauthorizedException({ code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN, message: 'Token expired' });
        }

        if (record?.user.isVerified) return;

        await this.prisma.user.update({
            where: { id: record.userId },
            data: { isVerified: true },
        });

        await this.prisma.emailVerificationToken.delete({
            where: { id: record.id },
        });
    }
}
