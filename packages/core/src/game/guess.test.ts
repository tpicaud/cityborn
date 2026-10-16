import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildWorldLocation,
  type FullGuessObject,
  type Guess,
} from '@cityborn/api';
import { createGuess, type GuessObjectArea, guessObjectArea } from './guess';

const parisSquare: number[][][] = [
  [
    [2.2, 48.8],
    [2.5, 48.8],
    [2.5, 48.9],
    [2.2, 48.9],
    [2.2, 48.8],
  ],
];

const guessObjectBornInParisArea: FullGuessObject = buildFullGuessObject({
  world_location: buildWorldLocation({
    centroid: [48.85, 2.35],
    geometry: { type: 'Polygon', coordinates: parisSquare },
  }),
});

const guessObjectBornInParisPoint: FullGuessObject = buildFullGuessObject({
  world_location: buildWorldLocation({
    centroid: [48.8566, 2.3522],
    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  }),
});

describe('createGuess', () => {
  it('wins with the maximum points inside the birth area', () => {
    const guess: Guess = createGuess(guessObjectBornInParisArea, {
      lat: 48.86,
      lng: 2.3,
    });

    assert.equal(guess.win, true);
    assert.equal(guess.distance, 0);
    assert.equal(guess.points, 1000);
  });

  it('measures a guess outside the birth area from the centroid', () => {
    const guess: Guess = createGuess(guessObjectBornInParisArea, {
      lat: 45.764,
      lng: 4.8357,
    });

    assert.equal(guess.win, false);
    assert.equal(Math.round(guess.distance), 391);
    assert.equal(guess.points, 676);
  });

  it('never wins on a point birth location and measures from the centroid', () => {
    const guess: Guess = createGuess(guessObjectBornInParisPoint, {
      lat: 48.8566,
      lng: 2.3522,
    });

    assert.equal(guess.win, false);
    assert.equal(guess.distance, 0);
  });
});

describe('guessObjectArea', () => {
  it('ignores an unclosed polygon', () => {
    const guessObject: FullGuessObject = buildFullGuessObject({
      world_location: buildWorldLocation({
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [2.2, 48.8],
              [2.5, 48.8],
              [2.5, 48.9],
              [2.2, 48.9],
            ],
          ],
        },
      }),
    });

    const area: GuessObjectArea | undefined = guessObjectArea(guessObject);

    assert.equal(area, undefined);
  });
});
