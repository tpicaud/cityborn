import type { Coord } from '@cityborn/api';

export type RouteLabel = {
  position: Coord;
  angleInDegrees: number;
};

const degreesPerRadian: number = 180 / Math.PI;

function mercatorY(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + lat / degreesPerRadian / 2));
}

function latitudeAtMercatorY(y: number): number {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * degreesPerRadian;
}

function uprightAngle(angleInDegrees: number): number {
  if (angleInDegrees > 90) return angleInDegrees - 180;
  if (angleInDegrees < -90) return angleInDegrees + 180;
  return angleInDegrees;
}

export function createRouteLabel({
  guess,
  answer,
}: {
  guess: Coord;
  answer: Coord;
}): RouteLabel {
  const guessY: number = mercatorY(guess.lat);
  const answerY: number = mercatorY(answer.lat);
  const eastwardDistance: number = (answer.lng - guess.lng) / degreesPerRadian;
  const southwardDistance: number = guessY - answerY;

  return {
    position: {
      lat: latitudeAtMercatorY((guessY + answerY) / 2),
      lng: (guess.lng + answer.lng) / 2,
    },
    angleInDegrees: uprightAngle(
      Math.atan2(southwardDistance, eastwardDistance) * degreesPerRadian,
    ),
  };
}
