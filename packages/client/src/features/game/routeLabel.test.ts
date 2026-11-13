import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Coord } from '@cityborn/api';
import { createRouteLabel, type RouteLabel } from './routeLabel';

const paris: Coord = { lat: 48.8566, lng: 2.3522 };
const tokyo: Coord = { lat: 35.6762, lng: 139.6503 };

describe('createRouteLabel', () => {
  it('stays horizontal along a parallel', () => {
    const routeLabel: RouteLabel = createRouteLabel({
      guess: { lat: 0, lng: -10 },
      answer: { lat: 0, lng: 10 },
    });

    assert.deepEqual(routeLabel, {
      position: { lat: 0, lng: 0 },
      angleInDegrees: 0,
    });
  });

  it('tilts clockwise toward an answer lying south-east of the guess', () => {
    const routeLabel: RouteLabel = createRouteLabel({
      guess: paris,
      answer: tokyo,
    });

    assert.ok(routeLabel.angleInDegrees > 0 && routeLabel.angleInDegrees < 90);
  });

  it('keeps the label upright whatever the direction of the route', () => {
    const towardTokyo: RouteLabel = createRouteLabel({
      guess: paris,
      answer: tokyo,
    });

    const towardParis: RouteLabel = createRouteLabel({
      guess: tokyo,
      answer: paris,
    });

    assert.equal(
      towardParis.angleInDegrees.toFixed(6),
      towardTokyo.angleInDegrees.toFixed(6),
    );
  });

  it('places the label halfway along the straight map line', () => {
    const routeLabel: RouteLabel = createRouteLabel({
      guess: { lat: 0, lng: 0 },
      answer: { lat: 60, lng: 0 },
    });

    assert.ok(routeLabel.position.lat > 30 && routeLabel.position.lat < 60);
    assert.equal(routeLabel.position.lng, 0);
  });
});
