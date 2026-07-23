/// <reference types="@types/google.maps" />
import type { WorldLocation } from '@cityborn/api';
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

interface GoogleMapsProps {
  API_KEY: string;
  world_location?: WorldLocation;
}

export const WorldLocationViewer: React.FC<GoogleMapsProps> = ({
  API_KEY,
  world_location,
}) => {
  const defaultCenter = { lat: 48.8566, lng: 2.3522 }; // Exemple : Paris
  const defaultZoom = 5;

  return (
    <APIProvider apiKey={API_KEY} libraries={['geometry']}>
      <Map
        id="map"
        mapId="3fe9c0c47c132c089312908f"
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        disableDefaultUI
        clickableIcons={false} // désactive les icônes cliquables (restaurants, etc.)
        scrollwheel={true}
      >
        <WorldLocationDisplay world_location={world_location} />
      </Map>
    </APIProvider>
  );
};

const WorldLocationDisplay: React.FC<{
  world_location: WorldLocation | undefined;
}> = ({ world_location }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.data.forEach((feature: any) => map.data.remove(feature));

    if (!world_location) {
      map.setZoom(2); // par exemple niveau global
      map.setCenter({ lat: 0, lng: 0 }); // centre par défaut, ici équateur / Greenwich
      return;
    }

    map.data.forEach((feature: any) => map.data.remove(feature));
    map.data.addGeoJson(convertToGeoJson(world_location.geometry));
    map.data.setStyle({
      fillColor: '#FF0000',
      strokeColor: '#FF0000',
      strokeWeight: 1,
      fillOpacity: 0.2,
    });

    console.log(world_location);

    // Centrage sur le centroid ou sur les bounds
    const point = world_location.centroid;
    const isPoint = world_location.geometry.type === 'Point';
    if (isPoint) {
      map.panTo({ lat: point[0], lng: point[1] });
      map.setZoom(12);
    } else {
      const bounds = new google.maps.LatLngBounds();
      const geojson = convertToGeoJson(world_location.geometry);
      const coords =
        geojson.type === 'FeatureCollection'
          ? geojson.features.flatMap((f: any) => getCoordinates(f.geometry))
          : getCoordinates(geojson.geometry);

      coords.forEach(([lng, lat]: [number, number]) =>
        bounds.extend({ lat, lng }),
      );
      map.fitBounds(bounds);
    }
  }, [map, world_location]);

  if (!map || !world_location) return;

  const point = world_location.centroid;
  return world_location.geometry.type !== 'Point' ? (
    <AdvancedMarker position={{ lat: point[0], lng: point[1] }} />
  ) : null;
};

function convertToGeoJson(geometry: any) {
  if (!geometry) return null;

  if (geometry.type === 'Feature' || geometry.type === 'FeatureCollection') {
    return geometry; // déjà correct
  }

  // sinon c’est une geometry brute → on crée un Feature
  return {
    type: 'Feature',
    geometry,
    properties: {},
  };
}

function getCoordinates(geometry: any): [number, number][] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates;
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    default:
      return [];
  }
}
