import { Injectable } from '@nestjs/common';
import { tennis_dictionnary } from './custom_dictionnaries';

@Injectable()
export class IdService {

    /**
 * Génère un ID unique pour une game.
 */
    generateGameId(): string {
        return uniqueNamesGenerator({
            dictionaries: [tennisDictionary, tennisDictionary, tennisDictionary],
            separator: '-',
        });
    }
}
