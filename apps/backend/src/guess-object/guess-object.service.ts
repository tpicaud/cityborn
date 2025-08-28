import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GuessObject as GuessObjectSchema, GuessObjectDocument } from './guess-object.schema';
import { Model } from 'mongoose';
import { Categories, GameConfig, GuessObject } from '@cityborn/types';
import { ErrorCode } from '@cityborn/errors';

@Injectable()
export class GuessObjectService {
    constructor(@InjectModel(GuessObjectSchema.name, 'guessObjects') private guessObjectModel: Model<GuessObjectDocument>) { }

    async findSome(guessObjectsIds: string[]): Promise<GuessObject[]> {
        try {
            const rawGuessObjects = await this.guessObjectModel.find({
                _id: { $in: guessObjectsIds }
            }).lean().exec();

            if (!rawGuessObjects || rawGuessObjects.length === 0) {
                throw new NotFoundException({ code: ErrorCode.GUESS_OBJECTS_NOT_FOUND, message: 'No GuessObjects found for the provided IDs' });
            }

            const guessObjects = rawGuessObjects
                .filter(doc => doc.name && doc.category && doc.description && doc.image)
                .map(doc => ({
                    id: doc._id.toString(),
                    name: doc.name,
                    category: doc.category,
                    description: doc.description,
                    short_description: doc.short_description,
                    image: doc.image,
                    answer: {
                        place_name: doc.answer?.place_name,
                        coordinates: doc.answer?.coordinates
                    }
                }));

            // Vérifier si certains IDs n’ont pas été trouvés
            const foundIds = guessObjects.map(obj => obj.id);
            const notFoundIds = guessObjectsIds.filter(id => !foundIds.includes(id));
            if (notFoundIds.length > 0) {
                throw new NotFoundException({ code: ErrorCode.GUESS_OBJECTS_NOT_FOUND, message: `No GuessObjects found for IDs ${notFoundIds}` });
            }

            return guessObjects;
        } catch (error) {
            throw new InternalServerErrorException({ code: ErrorCode.GUESS_OBJECTS_GET_FAILED, message: `Error retrieving guess objects from ids: ${error.message}` });
        }
    }

    async findByGameConfig(gameConfig: GameConfig): Promise<GuessObject[]> {
        try {
            const pipeline: any[] = [];

            // Appliquer un filtre par catégories (sauf si 'TOUTES' est inclus)
            if (
                gameConfig.categories &&
                gameConfig.categories.length > 0 &&
                !gameConfig.categories.includes(Categories.TOUTES)
            ) {
                pipeline.push({
                    $match: {
                        category: { $in: gameConfig.categories }
                    }
                });
            }

            // Tirer au sort un certain nombre d'objets
            pipeline.push({
                $sample: { size: gameConfig.nbOfObjects }
            });

            const rawObjects = await this.guessObjectModel.aggregate(pipeline).exec();

            // Optionnel : filtrer ceux qui n'ont pas les champs obligatoires
            const guessObjects = rawObjects
                .filter(doc => doc.name && doc.category && doc.description && doc.image)
                .map(doc => ({
                    id: doc._id.toString(),
                    name: doc.name,
                    category: doc.category,
                    description: doc.description,
                    short_description: doc.short_description,
                    image: doc.image,
                    answer: {
                        place_name: doc.answer?.place_name,
                        coordinates: doc.answer?.coordinates
                    }
                }));

            if (guessObjects.length === 0) {
                throw new NotFoundException({ code: ErrorCode.GUESS_OBJECTS_NOT_FOUND, message: `No guess objects found for the provided gameConfig ${gameConfig}` });
            }

            return guessObjects;
        } catch (error) {
            throw new InternalServerErrorException({ code: ErrorCode.GUESS_OBJECTS_GET_FAILED, message: `Error retrieving guess objects from game config: ${error.message}` })
        }
    }
}
