import { ErrorCode } from '@cityborn/errors';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface WikidataSearchResponse {
    results: WikidataItemResponse[];
}

export interface WikidataItemResponse {
    id: string;
    label: string;
    image?: string;
    description?: string;
    short_description?: string;
    world_location_id?: string;
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
            uselanguage: 'fr',
            search: q,
        });

        try {
            const response = await fetch(`${this.WIKIDATA_API_URL}?${params}`);
            if (!response.ok) {
                throw new Error(`Erreur Wikidata: ${response.statusText}`);
            }

            const data = await response.json();

            console.log(data.search[0])
            const wikidata_response: WikidataSearchResponse = {
                results: data.search
                    .filter((item: any) => item.label && item.label.trim() !== "")
                    .map((item: any) => ({
                        id: item.id,
                        label: item.label,
                        short_description: item.description || "",
                    })),
            };

            console.log(wikidata_response)
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

            const rawImageName = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
            const imageUrl = rawImageName
                ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(rawImageName)}`
                : undefined;


            const wikidataItem: WikidataItemResponse = {
                id: entity.id,
                label: entity.labels.fr?.value || entity.labels.en?.value || 'Unknown',
                short_description: (entity.descriptions.fr?.value || entity.descriptions.en?.value) ?? undefined,
                image: imageUrl,
                world_location_id: await this.getOSMId(entity.claims?.P19?.[0]?.mainsnak?.datavalue?.value.id) ?? undefined
            };

            return wikidataItem;
        } catch (error) {
            throw new InternalServerErrorException({
                code: ErrorCode.GUESS_OBJECTS_SEARCH_FAILED,
                message: `Error retrieving Wikidata entity ${id}: ${error.message}`,
            });
        }
    }

    // Auxiliary
    private async getOSMId(place_id: string): Promise<string | undefined> {
        if (!place_id) return undefined;

        const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${place_id}.json`);

        if (!response.ok) {
            throw new Error(`Erreur Wikidata: ${response.statusText}`);
        }

        const data = await response.json();
        const entity = data.entities[place_id];

        const osmIdClaim = entity.claims?.P402?.[0]?.mainsnak?.datavalue?.value;
        return osmIdClaim ?? undefined;
    }
}
