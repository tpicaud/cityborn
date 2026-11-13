'use client';

import type { Coord } from '@cityborn/api';
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import {
  createResultMapViewport,
  type ResultMapOverlay,
  type ResultMapViewport as Viewport,
  type ViewportRectangle,
} from './resultMapViewport';

type ResultMapViewportProps = {
  answer: Coord;
  guess?: Coord;
};

export default function ResultMapViewport({
  answer,
  guess,
}: ResultMapViewportProps) {
  const map: google.maps.Map | null = useMap();
  const answerLat: number = answer.lat;
  const answerLng: number = answer.lng;
  const guessLat: number | undefined = guess?.lat;
  const guessLng: number | undefined = guess?.lng;

  useEffect(() => {
    if (!map) return;

    const mapElement: HTMLElement = map.getDiv();
    const gameElement: Element | null = mapElement.closest(
      '[data-game-viewport]',
    );
    if (!gameElement) return;

    const edges: (keyof ViewportRectangle)[] = [
      'top',
      'right',
      'bottom',
      'left',
    ];
    const overlays: { edge: keyof ViewportRectangle; element: Element }[] =
      edges.flatMap((edge) =>
        Array.from(
          gameElement.querySelectorAll(`[data-result-map-overlay="${edge}"]`),
          (element) => ({ edge, element }),
        ),
      );
    let frame: number | undefined;

    const fitViewport = (): void => {
      const measuredOverlays: ResultMapOverlay[] = overlays.map(
        ({ edge, element }) => ({
          edge,
          rectangle: element.getBoundingClientRect(),
        }),
      );
      const viewport: Viewport | undefined = createResultMapViewport({
        answer: { lat: answerLat, lng: answerLng },
        guess:
          guessLat !== undefined && guessLng !== undefined
            ? { lat: guessLat, lng: guessLng }
            : undefined,
        viewport: mapElement.getBoundingClientRect(),
        overlays: measuredOverlays,
      });

      if (viewport) map.fitBounds(viewport.bounds, viewport.padding);
    };

    const scheduleFit = (): void => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitViewport);
    };

    const observer: ResizeObserver = new ResizeObserver(scheduleFit);
    observer.observe(mapElement);
    overlays.forEach(({ element }) => {
      observer.observe(element);
    });
    scheduleFit();

    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [map, answerLat, answerLng, guessLat, guessLng]);

  return null;
}
