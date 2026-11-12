/// <reference types="@types/google.maps" />
'use client';

import {
  type Coord,
  type FullGuessObject,
  type Guess,
  type PlayerId,
  type Round,
  RoundStatus,
} from '@cityborn/api';
import {
  createRouteLabel,
  currentRevealedGuessObject,
  formatDistanceInKm,
  type MapProps,
  type RouteLabel,
} from '@cityborn/client/game';
import {
  type GuessObjectArea,
  guessObjectArea,
  guessObjectCenter,
} from '@cityborn/core';
import { AngledTag, brandColors } from '@cityborn/design-system';
import answerMarker from '@cityborn/design-system/assets/map/answer.png';
import guessPin from '@cityborn/design-system/assets/map/guess-pin.png';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  type MapMouseEvent,
  useMap,
} from '@vis.gl/react-google-maps';
import Image from 'next/image';
import { Fragment, useEffect, useMemo } from 'react';

type MarkerSize = {
  width: number;
  height: number;
};

const guessPinSize: MarkerSize = { width: 40.6, height: 50.5 };
const answerMarkerSize: MarkerSize = { width: 28, height: 28 };
const guessPinTipTop: string = '-80.6%';
const answerMarkerCenterTop: string = '-42.9%';
const otherPlayersOpacity: number = 0.6;

const zoomPadding: google.maps.Padding = {
  top: 120,
  right: 60,
  bottom: 240,
  left: 60,
};

export type RoundMapProps = {
  googleMapsApiKey: string;
  mapProps: MapProps;
};

function GuessPin({
  position,
  opacity = 1,
}: {
  position: Coord;
  opacity?: number;
}) {
  return (
    <AdvancedMarker
      position={position}
      anchorLeft="-50%"
      anchorTop={guessPinTipTop}
    >
      <Image
        src={guessPin}
        alt=""
        width={guessPinSize.width}
        height={guessPinSize.height}
        style={{ opacity }}
      />
    </AdvancedMarker>
  );
}

export default function RoundMap({
  googleMapsApiKey,
  mapProps: { center, zoom, preGuess, localPlayerID, game, handlePreGuess },
}: RoundMapProps) {
  const currentRound: Round | undefined = game.state.currentRound;
  const revealedGuessObject: FullGuessObject | undefined = useMemo(
    () => currentRevealedGuessObject(game),
    [game],
  );

  if (!currentRound) return null;

  const handleMapClick: (event: MapMouseEvent) => void = (event) => {
    if (event.detail.latLng) handlePreGuess(event.detail.latLng);
  };

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <GoogleMap
        id="map"
        key={currentRound.guessObjectId}
        mapId="e475de68d18cf73"
        defaultCenter={center}
        defaultZoom={zoom}
        zoomControl={false}
        clickableIcons={false}
        fullscreenControl={false}
        mapTypeControl={false}
        streetViewControl={false}
        minZoom={2}
        restriction={{
          latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
        }}
        onClick={handleMapClick}
      >
        {preGuess && <GuessPin position={preGuess} />}

        {currentRound.status === RoundStatus.SHOWING_RESULTS &&
          revealedGuessObject && (
            <RevealedRound
              currentRound={currentRound}
              guessObject={revealedGuessObject}
              localPlayerID={localPlayerID}
            />
          )}
        <ResetMap center={center} zoom={zoom} />
      </GoogleMap>
    </APIProvider>
  );
}

function RevealedRound({
  currentRound,
  guessObject,
  localPlayerID,
}: {
  currentRound: Round;
  guessObject: FullGuessObject;
  localPlayerID: PlayerId;
}) {
  const answer: Coord = useMemo(
    () => guessObjectCenter(guessObject),
    [guessObject],
  );
  const playersGuesses: [string, Guess][] = Object.entries(
    currentRound.playersGuesses ?? {},
  );
  const localGuess: Guess | undefined =
    currentRound.playersGuesses?.[localPlayerID];
  const placedLocalGuess: Guess | undefined =
    localGuess && localGuess.distance !== -1 ? localGuess : undefined;

  return (
    <>
      <AnswerArea guessObject={guessObject} />
      {playersGuesses
        .filter(
          ([playerID, guess]) =>
            playerID !== localPlayerID && guess.distance !== -1,
        )
        .map(([playerID, guess]) => (
          <Fragment key={playerID}>
            <GuessPin
              position={guess.coordinates}
              opacity={otherPlayersOpacity}
            />
            <DottedRoute
              guess={guess.coordinates}
              answer={answer}
              opacity={otherPlayersOpacity}
            />
          </Fragment>
        ))}
      {placedLocalGuess && (
        <>
          {!placedLocalGuess.win && (
            <LocalRoute guess={placedLocalGuess} answer={answer} />
          )}
          <GuessPin position={placedLocalGuess.coordinates} />
        </>
      )}
      <AdvancedMarker
        position={answer}
        anchorLeft="-50%"
        anchorTop={answerMarkerCenterTop}
      >
        <Image
          src={answerMarker}
          alt=""
          width={answerMarkerSize.width}
          height={answerMarkerSize.height}
        />
      </AdvancedMarker>
      <ZoomToBounds answer={answer} guess={placedLocalGuess?.coordinates} />
    </>
  );
}

function LocalRoute({ guess, answer }: { guess: Guess; answer: Coord }) {
  const routeLabel: RouteLabel = createRouteLabel({
    guess: guess.coordinates,
    answer,
  });

  return (
    <>
      <DottedRoute guess={guess.coordinates} answer={answer} opacity={1} />
      <AdvancedMarker
        position={routeLabel.position}
        anchorLeft="-50%"
        anchorTop="-50%"
      >
        <AngledTag
          label={`${formatDistanceInKm(guess.distance)}km`}
          angleInDegrees={routeLabel.angleInDegrees}
        />
      </AdvancedMarker>
    </>
  );
}

function ZoomToBounds({ answer, guess }: { answer: Coord; guess?: Coord }) {
  const map: google.maps.Map | null = useMap();

  useEffect(() => {
    if (!map) return;
    const bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();
    bounds.extend(answer);
    if (guess) bounds.extend(guess);

    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      map.fitBounds(bounds, zoomPadding);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [guess, answer, map]);

  return null;
}

function DottedRoute({
  guess,
  answer,
  opacity,
}: {
  guess: Coord;
  answer: Coord;
  opacity: number;
}) {
  const map: google.maps.Map | null = useMap();

  useEffect(() => {
    if (!map) return;
    const line: google.maps.Polyline = new google.maps.Polyline({
      path: [guess, answer],
      geodesic: false,
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeColor: brandColors['dark-blue'],
            strokeOpacity: opacity,
            strokeWeight: 2,
            scale: 1,
          },
          offset: '0',
          repeat: '4px',
        },
      ],
      map,
    });

    return () => line.setMap(null);
  }, [guess, answer, opacity, map]);

  return null;
}

function ResetMap({ center, zoom }: { center: Coord; zoom: number }) {
  const map: google.maps.Map | null = useMap();

  useEffect(() => {
    if (!map) return;
    map.setCenter(center);
    map.setZoom(zoom);
  }, [center, map, zoom]);

  return null;
}

function AnswerArea({ guessObject }: { guessObject: FullGuessObject }) {
  const map: google.maps.Map | null = useMap();

  useEffect(() => {
    if (!map) return;

    const area: GuessObjectArea | undefined = guessObjectArea(guessObject);
    if (area) {
      map.data.addGeoJson({ type: 'Feature', geometry: area, properties: {} });
      map.data.setStyle({
        fillColor: brandColors['secondary-cyan'],
        strokeColor: brandColors['secondary-cyan'],
        strokeWeight: 1,
        fillOpacity: 0.2,
      });
    }

    return () => {
      map.data.forEach((feature: google.maps.Data.Feature) => {
        map.data.remove(feature);
      });
    };
  }, [map, guessObject]);

  return null;
}
