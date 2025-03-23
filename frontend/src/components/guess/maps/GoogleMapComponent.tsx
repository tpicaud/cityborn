'use client';

import React, { useEffect } from "react";
import { AdvancedMarker, AdvancedMarkerAnchorPoint, APIProvider, Map, MapMouseEvent, useMap } from "@vis.gl/react-google-maps";
import { calculatePoints } from "@/utils/calculateScore";
import MapProps from "@/types/MapProps";
import Coord from "@/types/Coord";
import Guess from "@/types/Guess";
import GuessObject from "@/types/GuessObject";
import { RoundStatus } from "@/enums/RoundStatus";
import Round from "@/types/Round";
import * as turf from '@turf/turf';

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

  const currentRound = game.currentRound!

  const mapOptions = {
    mapId: 'e475de68d18cf73',
    defaultCenter: center || { lat: 22.54992, lng: 0 },
    defaultZoom: zoom || 3,
    zoomControl: false,
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

    if (isGeoJSON(currentRound.guessObject) && hasWin(guessedLatLng, currentRound.guessObject)) {
      return 0;
    }

    const answer: Coord = getCenterOfGuessObject(currentRound.guessObject)
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
            <AnswerDisplay guessObject={currentRound.guessObject} />
            <LocalPlayerGuess currentRound={currentRound} localPlayerID={localPlayerID} />
            <OtherPlayersGuesses currentRound={currentRound} localPlayerID={localPlayerID} />
          </>
        )}
        <ResetMap guessObjectName={currentRound.guessObject.name} center={mapOptions.defaultCenter} zoom={mapOptions.defaultZoom} />

      </Map>
    </APIProvider>
  );
};

const OtherPlayersGuesses: React.FC<{ currentRound: Round, localPlayerID: string }> = ({ currentRound, localPlayerID }) => {

  const guesses = currentRound.playersGuesses
    ? Object.entries(currentRound.playersGuesses)
      .filter(([playerID]) => playerID !== localPlayerID) // Exclut le guess du localPlayerID
      .map(([, guess]) => guess)
    : [];

  return (
    <>
      {guesses.map((guess, index) => (
        (guess.distance !== -1) &&
        <AdvancedMarker
          key={index}
          position={guess.coordinates}
          anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
        >
          <img src={'/img/player.png'} alt="players Marker" width={28} height={28} />
        </AdvancedMarker>

      ))}
    </>
  );
};

const LocalPlayerGuess: React.FC<{ currentRound: Round, localPlayerID: string }> = ({ currentRound, localPlayerID }) => {

  const guess = currentRound.playersGuesses![localPlayerID];

  return (
    <>
      {(guess.distance !== -1) ? (
        <>
          <AdvancedMarker position={guess.coordinates} />
          <ZoomToBounds answer={getCenterOfGuessObject(currentRound.guessObject)} guess={guess.coordinates} />
          {!guess.win && (
            <LineBetween answer={getCenterOfGuessObject(currentRound.guessObject)} guess={guess.coordinates} />
          )}
        </>
      ) : (
        <ZoomToBounds answer={getCenterOfGuessObject(currentRound.guessObject)} />
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

const LineBetween: React.FC<{ guess: Coord, answer: Coord }> = ({ guess, answer }) => {
  const map = useMap();

  useEffect(() => {

    const line = new google.maps.Polyline({
      path: [
        { lat: guess.lat, lng: guess.lng },
        { lat: answer.lat, lng: answer.lng },
      ],
      geodesic: true,
      strokeColor: '#0000FF',
      strokeOpacity: 0,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
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

const ResetMap: React.FC<{ guessObjectName: string, center: Coord, zoom: number }> = ({ guessObjectName, center, zoom }) => {
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
  }, [guessObjectName]);

  return null; // No visual render, just resetting the map
}

const AnswerDisplay: React.FC<{ guessObject: GuessObject }> = ({ guessObject }) => {
  const map = useMap()

  if (!isGeoJSON(guessObject)) {

    // Display the point
    const point: Coord = guessObject.answer.coordinates.value
    return (
      <AdvancedMarker position={point} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
        <img src={'/img/answer_marker.png'} alt="Answer Marker" width={32} height={32} />
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
        <img src={'/img/answer_marker.png'} alt="Answer Marker" width={32} height={32} />
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


  // try {
  //   const areas = guessObject.answer.coordinates.value.boundaries.geometry.coordinates;

  //   for (const area of areas) {

  //     // Transform coordinates from GeoJSON to Google Maps LatLng format
  //     let polygonPath;
  //     if (areas.length !== 1) {
  //       polygonPath = area[0].map(([lng, lat]: [number, number]) => new google.maps.LatLng(lat, lng));
  //     } else {
  //       polygonPath = area.map(([lng, lat]: [number, number]) => new google.maps.LatLng(lat, lng));

  //     }

  //     const polygon = new google.maps.Polygon({
  //       paths: polygonPath
  //     });

  //     if (google.maps.geometry.poly.containsLocation(guessedLatLng, polygon)) {
  //       return true;
  //     }
  //   }
  //   return false
  // } catch {
  //   return false;
  // }
}

const isGeoJSON = (guessObject: GuessObject): boolean => {
  return guessObject.answer.coordinates.type === 'GeoJSON'
}

export default GoogleMapComponent;