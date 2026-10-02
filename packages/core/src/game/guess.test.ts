import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildFullGuessObject,
  buildWorldLocation,
  type FullGuessObject,
  type Guess,
} from '@cityborn/api';
import { createGuess, guessObjectArea } from './guess';

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

test('a guess inside the birth area wins with the maximum points', () => {
  const guess: Guess = createGuess(guessObjectBornInParisArea, {
    lat: 48.86,
    lng: 2.3,
  });

  assert.equal(guess.win, true);
  assert.equal(guess.distance, 0);
  assert.equal(guess.points, 1000);
});

test('a guess outside the birth area is measured from the centroid', () => {
  const guess: Guess = createGuess(guessObjectBornInParisArea, {
    lat: 45.764,
    lng: 4.8357,
  });

  assert.equal(guess.win, false);
  assert.ok(guess.distance > 380 && guess.distance < 400);
  assert.ok(guess.points > 0 && guess.points < 1000);
});

test('a point birth location is never won and is measured from the centroid', () => {
  const guess: Guess = createGuess(guessObjectBornInParisPoint, {
    lat: 48.8566,
    lng: 2.3522,
  });

  assert.equal(guess.win, false);
  assert.equal(guess.distance, 0);
});

test('an unclosed polygon is not used as a birth area', () => {
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

  assert.equal(guessObjectArea(guessObject), undefined);
});
