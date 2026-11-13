import type { Coord } from '@cityborn/api';

export type ViewportRectangle = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ResultMapOverlay = {
  edge: keyof ViewportRectangle;
  rectangle: ViewportRectangle;
};

export type ResultMapViewport = {
  bounds: { north: number; east: number; south: number; west: number };
  padding: ViewportRectangle;
};

type CreateResultMapViewportParameters = {
  answer: Coord;
  guess?: Coord;
  viewport: ViewportRectangle;
  overlays: ResultMapOverlay[];
};

export function createResultMapViewport({
  answer,
  guess = answer,
  viewport,
  overlays,
}: CreateResultMapViewportParameters): ResultMapViewport | undefined {
  const margin: number = 48;
  const padding: ViewportRectangle = overlays.reduce<ViewportRectangle>(
    (current, { edge, rectangle }) => {
      if (
        rectangle.right <= viewport.left ||
        rectangle.left >= viewport.right ||
        rectangle.bottom <= viewport.top ||
        rectangle.top >= viewport.bottom
      ) {
        return current;
      }

      const covered: ViewportRectangle = {
        top: rectangle.bottom - viewport.top,
        right: viewport.right - rectangle.left,
        bottom: viewport.bottom - rectangle.top,
        left: rectangle.right - viewport.left,
      };

      current[edge] = Math.max(current[edge], covered[edge] + margin);
      return current;
    },
    { top: margin, right: margin, bottom: margin, left: margin },
  );

  if (
    viewport.right - viewport.left <= padding.left + padding.right ||
    viewport.bottom - viewport.top <= padding.top + padding.bottom
  ) {
    return undefined;
  }

  const latitudeCenter: number = (answer.lat + guess.lat) / 2;
  const latitudeSpan: number = Math.max(Math.abs(answer.lat - guess.lat), 0.3);
  const longitudeDelta: number = ((guess.lng - answer.lng + 540) % 360) - 180;
  const longitudeCenter: number = answer.lng + longitudeDelta / 2;
  const longitudeSpan: number = Math.max(Math.abs(longitudeDelta), 0.3);
  const wrapLongitude: (longitude: number) => number = (longitude) =>
    ((longitude + 540) % 360) - 180;

  return {
    bounds: {
      north: Math.min(90, latitudeCenter + latitudeSpan / 2),
      south: Math.max(-90, latitudeCenter - latitudeSpan / 2),
      east: wrapLongitude(longitudeCenter + longitudeSpan / 2),
      west: wrapLongitude(longitudeCenter - longitudeSpan / 2),
    },
    padding,
  };
}
