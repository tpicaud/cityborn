import { ErrorCode } from '@cityborn/errors';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface WikidataSearchResponse {
    results: WikidataItemResponse[];
}

export interface WikidataItemResponse {
    id: string;
    label: string;
    description?: string;
}

@Injectable()
export class WikidataService {

    private WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php'
    private WIKIDATA_URL = 'https://www.wikidata.org/wiki'

    constructor() { }

    /**
     * Wikidata search by name
     */
    async searchByName(q: string): Promise<WikidataSearchResponse> {
        const params = new URLSearchParams({
            action: 'wbsearchentities',
            format: 'json',
            language: 'fr',
            search: q,
        });

        try {
            const response = await fetch(`${this.WIKIDATA_API_URL}?${params}`);
            if (!response.ok) {
                throw new Error(`Erreur Wikidata: ${response.statusText}`);
            }

            const data = await response.json();
            const wikidata_response: WikidataSearchResponse = {
                results: data.search.map((item: any) => ({
                    id: item.id,
                    label: item.label,
                    description: item.description,
                }))
            }

            return wikidata_response;
        } catch (error) {
            throw new InternalServerErrorException({
                code: ErrorCode.GUESS_OBJECTS_SEARCH_FAILED,
                message: `Error retrieving wikidata search results: ${error.message}`,
            });
        }
    }

    /**
     * Wikidata search by id
     */
    async searchById(id: string): Promise<WikidataItemResponse> {
        try {
            const response = await fetch(`${this.WIKIDATA_URL}/Special:EntityData/${id}.json`);
            if (!response.ok) {
                throw new Error(`Erreur Wikidata: ${response.statusText}`);
            }

            const data = await response.json();
            const entity = data.entities[id];

            const wikidataItem: WikidataItemResponse = {
                id: entity.id,
                label: entity.labels.fr?.value || entity.labels.en?.value || 'Unknown',
                description: entity.descriptions.fr?.value || entity.descriptions.en?.value,
            };

            return wikidataItem;
        } catch (error) {
            throw new InternalServerErrorException({
                code: ErrorCode.GUESS_OBJECTS_SEARCH_FAILED,
                message: `Error retrieving Wikidata entity ${id}: ${error.message}`,
            });
        }
    }
}
