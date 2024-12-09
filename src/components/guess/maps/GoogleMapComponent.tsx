'use client';

import React, { useEffect } from "react";
import { AdvancedMarker, AdvancedMarkerAnchorPoint, APIProvider, Map, MapMouseEvent, useMap } from "@vis.gl/react-google-maps";
import { calculatePoints } from "@/utils/calculateScore";
import MapProps from "@/types/MapProps";
import Coord from "@/types/Coord";
import Guess from "@/types/Guess";

type GoogleMapProps = {
  API_KEY: string;
  mapProps: MapProps;
};

const GoogleMapComponent: React.FC<GoogleMapProps> = ({
  API_KEY,
  mapProps: { center, zoom, preGuess, guess, answer, handlePreGuess },
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
          if (!guess) {
            handleMapClick(event);
          }
        }}
      >
        {/* Pre-guess advanced marker */}
        {preGuess && <AdvancedMarker position={preGuess.coordinates} />}

        {/* Confirmed guess advanced marker */}
        {guess && (
          <>
            <AdvancedMarker position={answer} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
              <img src={'/img/answer_marker.png'} alt="Answer Marker" width={32} height={32} />
            </AdvancedMarker>
            {(guess.distance !== -1) ? (
              <>
                <ZoomToBounds guess={guess.coordinates} answer={answer} />
                <LineBetween guess={guess.coordinates} answer={answer} />
              </>) : (
              <ZoomToBounds guess={answer} answer={answer} />
            )}
          </>
        )}
        <ResetMap answer={answer} center={mapOptions.defaultCenter} zoom={mapOptions.defaultZoom} />

      </Map>
    </APIProvider>
  );
};

const ZoomToBounds: React.FC<{ guess: Coord, answer: Coord }> = ({ guess, answer }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(guess.lat, guess.lng));
      bounds.extend(new google.maps.LatLng(answer.lat, answer.lng));
      const padding = {top: 100, right: 25, bottom: 25, left: 25 };

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

const ResetMap: React.FC<{ answer: Coord, center: Coord, zoom: number }> = ({ answer, center, zoom }) => {
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
  }, [answer]);

  return null; // No visual render, just resetting the map
}

export default GoogleMapComponent;