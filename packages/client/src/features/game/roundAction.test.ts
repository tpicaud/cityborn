import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildGameState,
  buildGuess,
  buildRound,
  type Coord,
  type Game,
  type Guess,
  type GuessObjectId,
  GuessObjectIdSchema,
  type PlayerId,
  PlayerIdSchema,
  RoundStatus,
} from '@cityborn/api';
import {
  canPlaceGuess,
  createRoundAction,
  type RoundAction,
} from './roundAction';

const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
const otherPlayerID: PlayerId = PlayerIdSchema.parse('other-player');
const firstObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-1');
const secondObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-2');

const sentGuess: Guess = buildGuess({ distance: 391.42, points: 676 });
const preGuess: Coord = { lat: 45.76, lng: 4.83 };

function buildGameInRound({
  status,
  playersGuesses,
}: {
  status: RoundStatus;
  playersGuesses?: Record<PlayerId, Guess>;
}): Game {
  return buildGame({
    state: buildGameState({
      guessObjectsIds: [firstObjectID, secondObjectID],
      roundGuessObjects: [
        buildFullGuessObject({ id: firstObjectID }),
        buildFullGuessObject({ id: secondObjectID }),
      ],
      currentRound: buildRound({
        status,
        guessObjectId: firstObjectID,
        playersGuesses,
      }),
      results: {
        [localPlayerID]: { results: [] },
        [otherPlayerID]: { results: [] },
      },
    }),
  });
}

describe('createRoundAction', () => {
  it('offers to guess the pre-guess of a round the player has not guessed yet', () => {
    const game: Game = buildGameInRound({ status: RoundStatus.GUESSING });

    const roundAction: RoundAction | undefined = createRoundAction({
      game,
      localPlayerID,
      isHost: false,
      preGuess,
    });

    assert.deepEqual(roundAction, {
      kind: 'guess',
      label: 'Guess !',
      detail: undefined,
      isEnabled: true,
    });
  });

  it('offers no guess before a pre-guess is placed', () => {
    const game: Game = buildGameInRound({ status: RoundStatus.GUESSING });

    const roundAction: RoundAction | undefined = createRoundAction({
      game,
      localPlayerID,
      isHost: false,
      preGuess: undefined,
    });

    assert.equal(roundAction, undefined);
  });

  it('counts the players who guessed once the local guess is sent', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.GUESSING,
      playersGuesses: { [localPlayerID]: sentGuess },
    });

    const roundAction: RoundAction | undefined = createRoundAction({
      game,
      localPlayerID,
      isHost: false,
      preGuess,
    });

    assert.deepEqual(roundAction, {
      kind: 'guess',
      label: '1/2',
      detail: undefined,
      isEnabled: false,
    });
  });

  it('lets the host go to the next round with the round progress', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.SHOWING_RESULTS,
      playersGuesses: { [localPlayerID]: sentGuess },
    });

    const roundAction: RoundAction | undefined = createRoundAction({
      game,
      localPlayerID,
      isHost: true,
      preGuess: undefined,
    });

    assert.deepEqual(roundAction, {
      kind: 'nextRound',
      label: 'Suivant',
      detail: '1/2',
      isEnabled: true,
    });
  });

  it('disables the next round for a guest', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.SHOWING_RESULTS,
    });

    const roundAction: RoundAction | undefined = createRoundAction({
      game,
      localPlayerID,
      isHost: false,
      preGuess: undefined,
    });

    assert.equal(roundAction?.isEnabled, false);
  });

  it('offers no action without a round', () => {
    const game: Game = buildGame();

    const roundAction: RoundAction | undefined = createRoundAction({
      game,
      localPlayerID,
      isHost: true,
      preGuess,
    });

    assert.equal(roundAction, undefined);
  });
});

describe('canPlaceGuess', () => {
  it('accepts a guess during a round the player has not guessed yet', () => {
    const game: Game = buildGameInRound({ status: RoundStatus.GUESSING });

    const canPlace: boolean = canPlaceGuess({ game, localPlayerID });

    assert.equal(canPlace, true);
  });

  it('rejects a second guess in the same round', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.GUESSING,
      playersGuesses: { [localPlayerID]: sentGuess },
    });

    const canPlace: boolean = canPlaceGuess({ game, localPlayerID });

    assert.equal(canPlace, false);
  });

  it('rejects a guess once the results are shown', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.SHOWING_RESULTS,
    });

    const canPlace: boolean = canPlaceGuess({ game, localPlayerID });

    assert.equal(canPlace, false);
  });
});
