import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { uniqueNamesGenerator } from 'unique-names-generator';
import { tennis_dictionary } from './custom_dictionnaries';

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
