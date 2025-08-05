import { Injectable } from '@nestjs/common';
import { tennis_dictionary } from './custom_dictionnaries';
import { uniqueNamesGenerator } from "unique-names-generator";
import { customAlphabet } from 'nanoid';

@Injectable()
export class IdService {

    constructor() { }

    /**
    * Generate nano ID
    */
    generateNanoId(size: number = 6): string {
        try {
            const nanoid = customAlphabet('0123456789', size);
            return nanoid()
        } catch (error) {
            throw new Error(`Error generating id: ${error}`);
        }
    }

    /**
    * Generate readable ID with names
    */
    generateUniqueNamesId(): string {
        try {
            return uniqueNamesGenerator({
                dictionaries: [tennis_dictionary, tennis_dictionary, tennis_dictionary],
                separator: '-',
            });
        } catch (error) {
            throw new Error(`Error generating id: ${error}`);
        }
    }
}
