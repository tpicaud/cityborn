import { Injectable } from '@nestjs/common';
import { tennis_dictionary } from './custom_dictionnaries';
import { uniqueNamesGenerator } from 'unique-names-generator';
import { customAlphabet } from 'nanoid';

@Injectable()
export class IdService {
  constructor() {}

  /**
   * Generate nano ID
   */
  generateNanoId(size: number = 6): string {
    const nanoid = customAlphabet('0123456789', size);
    return nanoid();
  }

  /**
   * Generate readable ID with names
   */
  generateUniqueNamesId(): string {
    return uniqueNamesGenerator({
      dictionaries: [tennis_dictionary, tennis_dictionary, tennis_dictionary],
      separator: '-',
    });
  }
}
