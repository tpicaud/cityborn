/// <reference types="@types/google.maps" />
'use client';

import {
  type Coord,
  type FullGuessObject,
  type PlayerId,
  type Round,
  RoundStatus,
} from '@cityborn/api';
import type { MapProps } from '@cityborn/client/game';
import {
  createGuess,
  type GuessObjectArea,
  guessObjectArea,
  guessObjectCenter,
} from '@cityborn/core';
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APIProvider,
  Map as GoogleMap,
  type MapMouseEvent,
  useMap,
} from '@vis.gl/react-google-maps';
import Image from 'next/image';
import React, { useEffect } from 'react';

type GameMapProps = {
  googleMapsApiKey: string;
  mapProps: MapProps;
};

const GameMap: React.FC<GameMapProps> = ({
  googleMapsApiKey,
  mapProps: { center, zoom, preGuess, localPlayerID, game, handlePreGuess },
}) => {
  const currentRound = game.state.currentRound;
  const guessObject = (game.state.guessObjects ?? []).find(
    (obj) => obj.id === currentRound?.guessObjectId,
  );

  if (!currentRound || !guessObject) {
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
    minZoom: 2,
    defaultLogo: false,
    restriction: {
      latLngBounds: {
        north: 85,
        south: -85,
        west: -180,
        east: 180,
      },
    },
  };

  const handleMapClick = (event: MapMouseEvent) => {
    if (!event.detail.latLng) return;
    handlePreGuess(createGuess(guessObject, event.detail.latLng));
  };

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <GoogleMap
        id="map"
        key={guessObject.id}
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
        {preGuess &&
          preGuess.distance !== -1 &&
          currentRound.status === RoundStatus.GUESSING && (
            <AdvancedMarker position={preGuess.coordinates} />
          )}

        {currentRound.status === RoundStatus.SHOWING_RESULTS && (
          <>
            <AnswerDisplay guessObject={guessObject} />
            <LocalPlayerGuess
              currentRound={currentRound}
              guessObject={guessObject}
              localPlayerID={localPlayerID}
            />
            <OtherPlayersGuesses
              currentRound={currentRound}
              guessObject={guessObject}
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
  const map = useMap();

  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(answer.lat, answer.lng));

      if (guess) {
        bounds.extend(new google.maps.LatLng(guess.lat, guess.lng));
      }

      const padding = { top: 100, right: 25, bottom: 25, left: 25 };

      setTimeout(() => {
        map.fitBounds(bounds, padding);
        map.panToBounds(bounds, padding);
      }, 100);
    }
  }, [guess, answer, map]);

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
