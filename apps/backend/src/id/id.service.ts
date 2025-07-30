import { Injectable } from '@nestjs/common';
import { tennis_dictionary } from './custom_dictionnaries';
import { uniqueNamesGenerator } from "unique-names-generator";
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class IdService {

    constructor(
        private readonly redisService: RedisService
    ) { }

    /**
 * Génère un ID unique pour une game.
 */
    generateSoloGameID(): string {
        try {
            return uniqueNamesGenerator({
                dictionaries: [tennis_dictionary, tennis_dictionary, tennis_dictionary],
                separator: '-',
            });
        } catch (error) {
            throw new Error(`Error generating id: ${error}`);
        }
    }

    async generateMultiGameID(): Promise<string> {
        const MAX_ATTEMPTS = 3;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                const candidateId = uniqueNamesGenerator({
                    dictionaries: [tennis_dictionary, tennis_dictionary, tennis_dictionary],
                    separator: '-',
                });

                const game = await this.redisService.get(`game:${candidateId}`) ?? undefined;
                if (!game) return candidateId;
            } catch (error) {
                throw new Error(`Error during ID generation attempt ${attempt + 1}: ${error}`);
            }
        }
        throw new Error('Failed to generate a unique game ID after 3 attempts');
    }
}
