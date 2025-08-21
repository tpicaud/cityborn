import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User as PrismaUser } from '@prisma/client';
import { PublicUser } from '@cityborn/types';
import { toPublicUser } from './user.mapper';

@Injectable()
export class UserService {

    constructor(
        private readonly prisma: PrismaService
    ) { }

    async createUser(data: { email: string; username: string; password?: string, birthdate?: string }): Promise<PrismaUser> {
        return this.prisma.user.create({ data });
    }

    async findByIdentifier(identifier: string): Promise<PrismaUser | null> {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });
    }

    async findById(id: number): Promise<PrismaUser | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async validateIdentifiers(username: string, email: string): Promise<void> {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        });

        if (!existingUser) return;

        if (existingUser.username === username) {
            throw new ConflictException('Username already taken');
        }

        if (existingUser.email === email) {
            throw new ConflictException('Email already in use');
        }
    }

    getPublicUser(user: PrismaUser): PublicUser {
        return toPublicUser(user);
    }
}
