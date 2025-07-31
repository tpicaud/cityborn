import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GuessObject, GuessObjectDocument } from './guess-object.schema';
import { Model } from 'mongoose';
import { Categories, GameConfig } from '@cityborn/types';

@Injectable()
export class GuessObjectService {
    constructor(@InjectModel(GuessObject.name, 'guessObjects') private guessObjectModel: Model<GuessObjectDocument>) { }

    async findSome(guessObjectsIds: string[]): Promise<GuessObject[]> {
        if (!guessObjectsIds || guessObjectsIds.length === 0) {
            throw new BadRequestException('No guessObjectsIds provided');
        }

        const guessObjects = await this.guessObjectModel.find({
            _id: { $in: guessObjectsIds }
        }).exec();

        if (!guessObjects || guessObjects.length === 0) {
            throw new NotFoundException('No GuessObjects found for the provided IDs');
        }

        // Vérifier si certains IDs n’ont pas été trouvés
        const foundIds = guessObjects.map(obj => obj.id);
        const notFoundIds = guessObjectsIds.filter(id => !foundIds.includes(id));
        if (notFoundIds.length > 0) {
            throw new NotFoundException(`GuessObjects not found for IDs: ${notFoundIds.join(', ')}`);
        }

        return guessObjects;
    }

    async findByGameConfig(gameConfig: GameConfig): Promise<GuessObject[]> {
        console.log('Model collection name:', this.guessObjectModel.collection.name);

        try {
            const pipeline: any[] = [];

            // Appliquer un filtre par catégories (sauf si 'TOUTES' est inclus)
            if (
                gameConfig.categories &&
                gameConfig.categories.length > 0 &&
                !gameConfig.categories.includes(Categories.TOUTES) // Assure-toi que c'est bien le bon enum/string
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
                throw new NotFoundException('Aucun GuessObject trouvé avec la configuration fournie');
            }

            return guessObjects;
        } catch (error) {
            console.error('Erreur lors de la récupération des GuessObjects :', error.message);
            throw new Error('Erreur lors de la récupération des GuessObjects');
        }
    }

}
