'use client';

import React, { useEffect } from "react";
import { AdvancedMarker, AdvancedMarkerAnchorPoint, APIProvider, Map, MapMouseEvent, useMap } from "@vis.gl/react-google-maps";
import { calculatePoints } from "@/utils/calculateScore";
import { MapProps } from "@cityborn/types";
import { Coord } from "@cityborn/types";
import { Guess } from "@cityborn/types";
import { GuessObject } from "@cityborn/types";
import { RoundStatus } from "@cityborn/types";
import { Round } from "@cityborn/types";
import * as turf from '@turf/turf';
import Image from 'next/image';

type GoogleMapProps = {
  API_KEY: string;
  mapProps: MapProps;
};

const GoogleMapComponent: React.FC<GoogleMapProps> = ({
  API_KEY,
  mapProps: {
    center,
    zoom,
    preGuess,
    localPlayerID,
    game,
    handlePreGuess
  },
}) => {

  const currentRound = game.state.currentRound!
  const guessObject = game.state.guessObjects!.find((obj) => obj.id === currentRound.guessObjectId)!;

  const mapOptions = {
    mapId: 'e475de68d18cf73',
    defaultCenter: center || { lat: 22.54992, lng: 0 },
    defaultZoom: zoom || 3,
    zoomControl: false,
    clickableIcons: false,    // désactive les icônes cliquables (restaurants, etc.)
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

  const getDistanceTo = (lat: number, lng: number): number => {

    const guessedLatLng = new google.maps.LatLng(lat, lng);

    if (isGeoJSON(guessObject!) && hasWin(guessedLatLng, guessObject!)) {
      return 0;
    }

    const answer: Coord = getCenterOfGuessObject(guessObject!);
    const answerLatLng = new google.maps.LatLng(answer.lat, answer.lng);

    return google.maps.geometry.spherical.computeDistanceBetween(guessedLatLng, answerLatLng) / 1000;
  };

  const handleMapClick = (event: MapMouseEvent) => {
    if (event.detail.latLng) {
      const lat = event.detail.latLng.lat;
      const lng = event.detail.latLng.lng;

      const distance = (lat !== 0 && lng !== 0) ? getDistanceTo(lat, lng) : -1;
      const points = calculatePoints(distance);

      const newGuess: Guess = {
        coordinates: { lat, lng },
        distance,
        points,
        win: (distance === 0) ? true : false
      };
      handlePreGuess(newGuess);
    }
  };


  return (
    <APIProvider apiKey={API_KEY} libraries={['geometry']}>
      <Map
        id="map"
        {...mapOptions}
        onClick={(event) => {
          if (currentRound.status === RoundStatus.GUESSING && currentRound.playersGuesses?.[localPlayerID] === undefined) {
            handleMapClick(event);
          }
        }}
      >
        {/* Pre-guess advanced marker */}
        {preGuess && (preGuess.distance !== -1) && (currentRound.status === RoundStatus.GUESSING) && <AdvancedMarker position={preGuess.coordinates} />}

        {/* Confirmed guess advanced marker */}
        {(currentRound.status === RoundStatus.SHOWING_RESULTS) && (
          <>
            <AnswerDisplay guessObject={guessObject} />
            <LocalPlayerGuess currentRound={currentRound} guessObject={guessObject} localPlayerID={localPlayerID} />
            <OtherPlayersGuesses currentRound={currentRound} guessObject={guessObject} localPlayerID={localPlayerID} />
          </>
        )}
        <ResetMap guessObjectId={currentRound.guessObjectId} center={mapOptions.defaultCenter} zoom={mapOptions.defaultZoom} />

      </Map>
    </APIProvider>
  );
};

const OtherPlayersGuesses: React.FC<{ currentRound: Round, guessObject: GuessObject, localPlayerID: string }> = ({ currentRound, guessObject, localPlayerID }) => {

  const guesses = currentRound.playersGuesses
    ? Object.entries(currentRound.playersGuesses)
      .filter(([playerID]) => playerID !== localPlayerID) // Exclut le guess du localPlayerID
      .map(([, guess]) => guess)
    : [];

  return (
    <>
      {guesses.map((guess, index) => (
        (guess.distance !== -1) &&
        <React.Fragment key={index}>
          <AdvancedMarker
            key={index}
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

          <LineBetween guess={guess.coordinates} answer={getCenterOfGuessObject(guessObject)} isLocalPlayer={false} />
        </React.Fragment>
      ))}
    </>
  );
};

const LocalPlayerGuess: React.FC<{ currentRound: Round, guessObject: GuessObject, localPlayerID: string }> = ({ currentRound, guessObject, localPlayerID }) => {

  const guess = currentRound.playersGuesses![localPlayerID];

  return (
    <>
      {(guess.distance !== -1) ? (
        <>
          <AdvancedMarker position={guess.coordinates} />
          <ZoomToBounds answer={getCenterOfGuessObject(guessObject)} guess={guess.coordinates} />
          {!guess.win && (
            <LineBetween guess={guess.coordinates} answer={getCenterOfGuessObject(guessObject)} isLocalPlayer={true} />
          )}
        </>
      ) : (
        <ZoomToBounds answer={getCenterOfGuessObject(guessObject)} />
      )}
    </>
  );
};


const ZoomToBounds: React.FC<{ answer: Coord, guess?: Coord, }> = ({ answer, guess }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(answer.lat, answer.lng));

      if (guess) {
        bounds.extend(new google.maps.LatLng(guess.lat, guess.lng));
      }

      const padding = { top: 100, right: 25, bottom: 25, left: 25 };

      // add 0.1 delay
      setTimeout(() => {
        map.fitBounds(bounds, padding);
        map.panToBounds(bounds, padding);
      }, 100);
    }
  }, [guess, answer, map]);

  return null; // No visual render, just zooming to bounds
};

const LineBetween: React.FC<{ guess: Coord, answer: Coord, isLocalPlayer: boolean }> = ({ guess, answer, isLocalPlayer }) => {
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
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          strokeWeight: isLocalPlayer ? 5 : 2,
          scale: 4
        },
        offset: '20',
        repeat: '20px'
      }],
      map: map,
    });
    line.setMap(map);

    return () => {
      // Cleanup the line on unmount
      if (line) {
        line.setMap(null);
      }
    };
  }, [guess, answer]);

  return null; // No visual render, just adding a line to the map
};

const ResetMap: React.FC<{ guessObjectId: string, center: Coord, zoom: number }> = ({ guessObjectId, center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);

      // Remove any existing lines
      map.data.forEach((feature) => {
        map.data.remove(feature);
      });
    }
  }, [guessObjectId]);

  return null; // No visual render, just resetting the map
}

const AnswerDisplay: React.FC<{ guessObject: GuessObject }> = ({ guessObject }) => {
  const map = useMap()

  if (!isGeoJSON(guessObject)) {

    // Display the point
    const point: Coord = guessObject.answer.coordinates.value
    return (
      <AdvancedMarker position={point} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
        <Image
          src="/img/answer_marker.png"
          alt="players Marker"
          width={28}
          height={28}
          priority={false}
        />
      </AdvancedMarker>
    )
  } else {

    // Display boundaries of the city
    if (map) {
      map.data.addGeoJson(guessObject.answer.coordinates.value.boundaries);
      map.data.setStyle({
        fillColor: '#FF0000',
        strokeColor: '#FF0000',
        strokeWeight: 1,
        fillOpacity: 0.2,
      })
    }

    // Display center of the city
    const point: Coord = guessObject.answer.coordinates.value.cityCenter
    return (
      <AdvancedMarker position={point} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
        <Image
          src="/img/answer_marker.png"
          alt="players Marker"
          width={28}
          height={28}
          priority={false}
        />
      </AdvancedMarker>
    )
  }
}

const getCenterOfGuessObject = (guessObject: GuessObject): Coord => {
  if (!isGeoJSON(guessObject)) {
    return guessObject.answer.coordinates.value;
  } else {
    return guessObject.answer.coordinates.value.cityCenter
  }
}

const hasWin = (point: google.maps.LatLng, guessObject: GuessObject): boolean => {
  try {
    const geoJson = guessObject.answer.coordinates.value.boundaries
    const turfPoint = turf.point([point.lng(), point.lat()]);
    return turf.booleanPointInPolygon(turfPoint, geoJson);
  } catch {
    return false
  }
}

const isGeoJSON = (guessObject: GuessObject): boolean => {
  return guessObject.answer.coordinates.type === 'GeoJSON'
}

export default GoogleMapComponent;