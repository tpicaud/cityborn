import type { GuessObjectDraft } from '../schemas/guess-object.schema';

export function getGuessObjectDraftLocationId(
  draft: Pick<GuessObjectDraft, 'world_location'>,
): string | undefined {
  return draft.world_location?.id;
}
