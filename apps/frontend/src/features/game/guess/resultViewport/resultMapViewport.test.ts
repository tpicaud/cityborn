import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createResultMapViewport,
  type ResultMapOverlay,
  type ResultMapViewport,
  type ViewportRectangle,
} from './resultMapViewport.ts';

const viewport: ViewportRectangle = {
  top: 0,
  right: 1280,
  bottom: 800,
  left: 0,
};

describe('createResultMapViewport', () => {
  it('encloses distant north and south guesses with the same longitude', () => {
    const results: (ResultMapViewport | undefined)[] = [70, -50].map((lat) =>
      createResultMapViewport({
        answer: { lat: 20, lng: 2 },
        guess: { lat, lng: 2 },
        viewport,
        overlays: [],
      }),
    );

    assert.deepEqual(
      results.map((result) => ({
        north: result?.bounds.north,
        south: result?.bounds.south,
      })),
      [
        {
          north: 70,
          south: 20,
        },
        {
          north: 20,
          south: -50,
        },
      ],
    );
    results.forEach((result) => {
      assert.ok(result);
      assert.ok(Math.abs(result.bounds.west - 1.85) < 0.000001);
      assert.ok(Math.abs(result.bounds.east - 2.15) < 0.000001);
    });
  });

  it('keeps nonzero bounds around nearly aligned points', () => {
    const result: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 20, lng: 2 },
      guess: { lat: 70, lng: 2.00001 },
      viewport,
      overlays: [],
    });

    assert.ok(result);
    assert.equal(result.bounds.south, 20);
    assert.equal(result.bounds.north, 70);
    assert.ok(result.bounds.west < 2);
    assert.ok(result.bounds.east > 2.00001);
  });

  it('encloses distant east and west guesses with the same latitude', () => {
    const result: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 20, lng: -70 },
      guess: { lat: 20, lng: 70 },
      viewport,
      overlays: [],
    });

    assert.deepEqual(result?.bounds, {
      north: 20.15,
      south: 19.85,
      west: -70,
      east: 70,
    });
  });

  it('uses the short longitude interval across the antimeridian', () => {
    const result: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 10, lng: 179 },
      guess: { lat: -10, lng: -179 },
      viewport,
      overlays: [],
    });

    assert.deepEqual(result?.bounds, {
      north: 10,
      south: -10,
      west: 179,
      east: -179,
    });
  });

  it('centers nonzero bounds on the answer without a guess or with identical points', () => {
    const withoutGuess: ResultMapViewport | undefined = createResultMapViewport(
      {
        answer: { lat: 0, lng: 0 },
        viewport,
        overlays: [],
      },
    );
    const identicalGuess: ResultMapViewport | undefined =
      createResultMapViewport({
        answer: { lat: 0, lng: 0 },
        guess: { lat: 0, lng: 0 },
        viewport,
        overlays: [],
      });

    assert.ok(withoutGuess);
    assert.equal(withoutGuess.bounds.north, 0.15);
    assert.equal(withoutGuess.bounds.south, -0.15);
    assert.ok(Math.abs(withoutGuess.bounds.west + 0.15) < 0.000001);
    assert.ok(Math.abs(withoutGuess.bounds.east - 0.15) < 0.000001);
    assert.deepEqual(identicalGuess, withoutGuess);
  });

  it('reserves measured space for the card, navigation, options and result banner', () => {
    const overlays: ResultMapOverlay[] = [
      {
        edge: 'right',
        rectangle: { top: 56, right: 1260, bottom: 400, left: 1132 },
      },
      {
        edge: 'right',
        rectangle: { top: 350, right: 1272, bottom: 430, left: 1216 },
      },
      { edge: 'top', rectangle: { top: 8, right: 64, bottom: 48, left: 24 } },
      {
        edge: 'bottom',
        rectangle: { top: 620, right: 1152, bottom: 780, left: 128 },
      },
    ];

    const result: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 20, lng: 2 },
      guess: { lat: -50, lng: 2 },
      viewport,
      overlays,
    });

    assert.deepEqual(result?.padding, {
      top: 96,
      right: 196,
      bottom: 228,
      left: 48,
    });
  });

  it('measures padding relative to the map and follows a taller result banner', () => {
    const result: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 20, lng: 2 },
      viewport: { top: 50, left: 100, bottom: 850, right: 1380 },
      overlays: [
        {
          edge: 'right',
          rectangle: { top: 106, right: 1360, bottom: 450, left: 1232 },
        },
        {
          edge: 'bottom',
          rectangle: { top: 570, right: 1252, bottom: 830, left: 228 },
        },
      ],
    });

    assert.deepEqual(result?.padding, {
      top: 48,
      right: 196,
      bottom: 328,
      left: 48,
    });
  });

  it('ignores overlays outside the map', () => {
    const result: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 20, lng: 2 },
      viewport,
      overlays: [
        {
          edge: 'right',
          rectangle: { top: 0, right: 1500, bottom: 500, left: 1400 },
        },
      ],
    });

    assert.deepEqual(result?.padding, {
      top: 48,
      right: 48,
      bottom: 48,
      left: 48,
    });
  });

  it('skips a hidden map or a viewport fully covered by overlays', () => {
    const hidden: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 20, lng: 2 },
      viewport: { top: 0, right: 0, bottom: 0, left: 0 },
      overlays: [],
    });
    const covered: ResultMapViewport | undefined = createResultMapViewport({
      answer: { lat: 20, lng: 2 },
      viewport,
      overlays: [
        {
          edge: 'bottom',
          rectangle: { top: 50, right: 1280, bottom: 800, left: 0 },
        },
      ],
    });

    assert.equal(hidden, undefined);
    assert.equal(covered, undefined);
  });
});
