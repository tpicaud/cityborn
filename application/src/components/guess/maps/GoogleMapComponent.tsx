'use client';

import React, { useEffect } from "react";
import { AdvancedMarker, AdvancedMarkerAnchorPoint, APIProvider, Map, MapMouseEvent, useMap } from "@vis.gl/react-google-maps";
import { calculatePoints } from "@/utils/calculateScore";
import MapProps from "@/types/MapProps";
import Coord from "@/types/Coord";
import Guess from "@/types/Guess";
import GuessObject from "@/types/GuessObject";
import { RoundStatus } from "@/enums/RoundStatus";

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
    currentRound,
    handlePreGuess
  },
}) => {

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

    if (isGeoJSON(currentRound.guessObject)) {
      const polygon = getPolyfromGeoJSON(currentRound.guessObject);
      if (google.maps.geometry.poly.containsLocation(guessedLatLng, polygon)) {
        return 0;
      }
    }

    const answer: Coord = getCenterOfGuessObject(currentRound.guessObject)
    const answerLatLng = new google.maps.LatLng(answer.lat, answer.lng);

    return google.maps.geometry.spherical.computeDistanceBetween(guessedLatLng, answerLatLng) / 1000;
  };

  const handleMapClick = (event: MapMouseEvent) => {
    if (event.detail.latLng) {
      const lat = event.detail.latLng.lat;
      const lng = event.detail.latLng.lng;

      const distance = getDistanceTo(lat, lng);
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
          if (currentRound.status === RoundStatus.GUESSING) {
            handleMapClick(event);
          }
        }}
      >
        {/* Pre-guess advanced marker */}
        {preGuess && <AdvancedMarker position={preGuess.coordinates} />}

        {/* Confirmed guess advanced marker */}
        {(currentRound.status === RoundStatus.SHOWING_RESULTS) && (
          <>
            <AnswerDisplay guessObject={currentRound.guessObject} />
            {(preGuess && preGuess.distance !== -1) ? (
              <>
                <ZoomToBounds answer={getCenterOfGuessObject(currentRound.guessObject)} guess={preGuess.coordinates} />
                {!preGuess.win && (
                  <LineBetween answer={getCenterOfGuessObject(currentRound.guessObject)} guess={preGuess.coordinates} />
                )}
              </>) : (

              <ZoomToBounds answer={getCenterOfGuessObject(currentRound.guessObject)} />
            )}
          </>
        )}
        <ResetMap guessObject={currentRound.guessObject} center={mapOptions.defaultCenter} zoom={mapOptions.defaultZoom} />

      </Map>
    </APIProvider>
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

const ResetMap: React.FC<{ guessObject: GuessObject, center: Coord, zoom: number }> = ({ guessObject, center, zoom }) => {
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
  }, [guessObject]);

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

  return null;
}

const getCenterOfGuessObject = (guessObject: GuessObject): Coord => {
  if (!isGeoJSON(guessObject)) {
    return guessObject.answer.coordinates.value;
  } else {
    return guessObject.answer.coordinates.value.cityCenter
  }
}

const getPolyfromGeoJSON = (guessObject: GuessObject): google.maps.Polygon => {
  const coordinates = guessObject.answer.coordinates.value.boundaries.geometry.coordinates[0];

  // Transform coordinates from GeoJSON to Google Maps LatLng format
  const polygonPath = coordinates.map(([lng, lat]: [number, number]) => new google.maps.LatLng(lat, lng));

  const polygon = new google.maps.Polygon({
    paths: polygonPath
  });

  return polygon;
}

const isGeoJSON = (guessObject: GuessObject): boolean => {
  return guessObject.answer.coordinates.type === 'GeoJSON'
}

export default GoogleMapComponent;