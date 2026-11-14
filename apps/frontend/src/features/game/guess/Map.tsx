/// <reference types="@types/google.maps" />
'use client';

import {
  type Coord,
  type FullGuessObject,
  type PlayerId,
  type Round,
  RoundStatus,
} from '@cityborn/api';
import {
  currentRevealedGuessObject,
  type MapProps,
} from '@cityborn/client/game';
import {
  type GuessObjectArea,
  guessObjectArea,
  guessObjectCenter,
} from '@cityborn/core';
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APIProvider,
  Map as GoogleMap,
  type MapProps as GoogleMapProps,
  type MapMouseEvent,
  useMap,
} from '@vis.gl/react-google-maps';
import Image from 'next/image';
import React, { useEffect } from 'react';

type MapEdge = 'top' | 'right' | 'bottom' | 'left';

const MAP_EDGES: MapEdge[] = ['top', 'right', 'bottom', 'left'];
const RESULT_MARKER_MARGIN: number = 48;
const RESULT_MINIMUM_HALF_SPAN: number = 0.15;

type GameMapProps = {
  googleMapsApiKey: string;
  mapProps: MapProps;
};

const GameMap: React.FC<GameMapProps> = ({
  googleMapsApiKey,
  mapProps: { center, zoom, preGuess, localPlayerID, game, handlePreGuess },
}) => {
  const currentRound = game.state.currentRound;
  const revealedGuessObject: FullGuessObject | undefined =
    currentRevealedGuessObject(game);

  if (!currentRound) {
    return null;
  }

  const mapOptions = {
    mapId: 'e475de68d18cf73',
    defaultCenter: center || { lat: 22.54992, lng: 0 },
    defaultZoom: zoom || 3,
    zoomControl: false,
    clickableIcons: false,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    minZoom: currentRound.status === RoundStatus.SHOWING_RESULTS ? 0 : 2,
    restriction:
      currentRound.status === RoundStatus.SHOWING_RESULTS
        ? null
        : {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180,
            },
          },
  } satisfies GoogleMapProps;

  const handleMapClick = (event: MapMouseEvent) => {
    if (!event.detail.latLng) return;
    handlePreGuess(event.detail.latLng);
  };

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <GoogleMap
        id="map"
        key={currentRound.guessObjectId}
        {...mapOptions}
        onClick={(event) => {
          if (
            currentRound.status === RoundStatus.GUESSING &&
            currentRound.playersGuesses?.[localPlayerID] === undefined
          ) {
            handleMapClick(event);
          }
        }}
      >
        {preGuess && currentRound.status === RoundStatus.GUESSING && (
          <AdvancedMarker position={preGuess} />
        )}

        {currentRound.status === RoundStatus.SHOWING_RESULTS &&
          revealedGuessObject && (
            <>
              <AnswerDisplay guessObject={revealedGuessObject} />
              <LocalPlayerGuess
                currentRound={currentRound}
                guessObject={revealedGuessObject}
                localPlayerID={localPlayerID}
              />
              <OtherPlayersGuesses
                currentRound={currentRound}
                guessObject={revealedGuessObject}
                localPlayerID={localPlayerID}
              />
            </>
          )}
        <ResetMap
          guessObjectId={currentRound.guessObjectId}
          center={mapOptions.defaultCenter}
          zoom={mapOptions.defaultZoom}
        />
      </GoogleMap>
    </APIProvider>
  );
};

const OtherPlayersGuesses: React.FC<{
  currentRound: Round;
  guessObject: FullGuessObject;
  localPlayerID: PlayerId;
}> = ({ currentRound, guessObject, localPlayerID }) => {
  const guesses = currentRound.playersGuesses
    ? Object.entries(currentRound.playersGuesses).filter(
        ([playerID]) => playerID !== localPlayerID,
      )
    : [];

  return (
    <>
      {guesses.map(
        ([playerID, guess]) =>
          guess.distance !== -1 && (
            <React.Fragment key={playerID}>
              <AdvancedMarker
                key={playerID}
                position={guess.coordinates}
                anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
              >
                <Image
                  src="/img/player.png"
                  alt="players Marker"
                  width={28}
                  height={28}
                  priority={false}
                />
              </AdvancedMarker>

              <LineBetween
                guess={guess.coordinates}
                answer={guessObjectCenter(guessObject)}
                isLocalPlayer={false}
              />
            </React.Fragment>
          ),
      )}
    </>
  );
};

const LocalPlayerGuess: React.FC<{
  currentRound: Round;
  guessObject: FullGuessObject;
  localPlayerID: PlayerId;
}> = ({ currentRound, guessObject, localPlayerID }) => {
  const guess = currentRound.playersGuesses?.[localPlayerID];

  return (
    <>
      {guess && guess.distance !== -1 ? (
        <>
          <AdvancedMarker position={guess.coordinates} />
          {currentRound.status === RoundStatus.SHOWING_RESULTS && (
            <ZoomToBounds
              answer={guessObjectCenter(guessObject)}
              guess={guess.coordinates}
            />
          )}
          {!guess.win && (
            <LineBetween
              guess={guess.coordinates}
              answer={guessObjectCenter(guessObject)}
              isLocalPlayer={true}
            />
          )}
        </>
      ) : (
        currentRound.status === RoundStatus.SHOWING_RESULTS && (
          <ZoomToBounds answer={guessObjectCenter(guessObject)} />
        )
      )}
    </>
  );
};

const ZoomToBounds: React.FC<{ answer: Coord; guess?: Coord }> = ({
  answer,
  guess,
}) => {
  const map: google.maps.Map | null = useMap();
  const answerLat: number = answer.lat;
  const answerLng: number = answer.lng;
  const guessLat: number | undefined = guess?.lat;
  const guessLng: number | undefined = guess?.lng;

  useEffect(() => {
    if (!map) return;

    const bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();
    bounds.extend({
      lat: answerLat - RESULT_MINIMUM_HALF_SPAN,
      lng: answerLng - RESULT_MINIMUM_HALF_SPAN,
    });
    bounds.extend({
      lat: answerLat + RESULT_MINIMUM_HALF_SPAN,
      lng: answerLng + RESULT_MINIMUM_HALF_SPAN,
    });
    if (guessLat !== undefined && guessLng !== undefined) {
      bounds.extend({ lat: guessLat, lng: guessLng });
    }

    const mapElement: HTMLElement = map.getDiv();
    const overlays: { edge: MapEdge; element: Element }[] = MAP_EDGES.flatMap(
      (edge) =>
        Array.from(
          document.querySelectorAll(`[data-result-map-overlay="${edge}"]`),
          (element) => ({ edge, element }),
        ),
    );

    const fitBounds = (): void => {
      const mapRectangle: DOMRect = mapElement.getBoundingClientRect();
      const padding: Record<MapEdge, number> = {
        top: RESULT_MARKER_MARGIN,
        right: RESULT_MARKER_MARGIN,
        bottom: RESULT_MARKER_MARGIN,
        left: RESULT_MARKER_MARGIN,
      };
      overlays.forEach(({ edge, element }) => {
        const overlay: DOMRect = element.getBoundingClientRect();
        const covered: Record<MapEdge, number> = {
          top: overlay.bottom - mapRectangle.top,
          right: mapRectangle.right - overlay.left,
          bottom: mapRectangle.bottom - overlay.top,
          left: overlay.right - mapRectangle.left,
        };
        padding[edge] = Math.max(
          padding[edge],
          covered[edge] + RESULT_MARKER_MARGIN,
        );
      });
      map.fitBounds(bounds, padding);
    };

    const observer: ResizeObserver = new ResizeObserver(fitBounds);
    observer.observe(mapElement);
    overlays.forEach(({ element }) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [map, answerLat, answerLng, guessLat, guessLng]);

  return null;
};

const LineBetween: React.FC<{
  guess: Coord;
  answer: Coord;
  isLocalPlayer: boolean;
}> = ({ guess, answer, isLocalPlayer }) => {
  const map = useMap();

  useEffect(() => {
    const line = new google.maps.Polyline({
      path: [
        { lat: guess.lat, lng: guess.lng },
        { lat: answer.lat, lng: answer.lng },
      ],
      geodesic: true,
      strokeColor: isLocalPlayer ? '#0000FF' : '#616161',
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeWeight: isLocalPlayer ? 5 : 2,
            scale: 4,
          },
          offset: '20',
          repeat: '20px',
        },
      ],
      map: map,
    });
    line.setMap(map);

    return () => {
      if (line) {
        line.setMap(null);
      }
    };
  }, [guess, answer, isLocalPlayer, map]);

  return null;
};

const ResetMap: React.FC<{
  guessObjectId: string;
  center: Coord;
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.data.forEach((feature) => {
        map.data.remove(feature);
      });

      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [center, map, zoom]);

  return null;
};

const AnswerDisplay: React.FC<{ guessObject: FullGuessObject }> = ({
  guessObject,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const area: GuessObjectArea | undefined = guessObjectArea(guessObject);
    if (area) {
      map.data.addGeoJson({ type: 'Feature', geometry: area, properties: {} });
      map.data.setStyle({
        fillColor: '#FF0000',
        strokeColor: '#FF0000',
        strokeWeight: 1,
        fillOpacity: 0.2,
      });
    }

    return () => {
      map.data.forEach((feature) => {
        map.data.remove(feature);
      });
    };
  }, [map, guessObject]);

  return (
    <AdvancedMarker
      position={guessObjectCenter(guessObject)}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
    >
      <Image
        src="/img/answer_marker.png"
        alt="answer marker"
        width={28}
        height={28}
      />
    </AdvancedMarker>
  );
};

export default GameMap;
