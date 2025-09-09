import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCode } from '@cityborn/errors';
import { User as PrismaUser } from '@prisma/client';

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
