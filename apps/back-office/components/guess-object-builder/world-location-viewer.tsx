/// <reference types="@types/google.maps" />
import type { WorldLocation } from '@cityborn/api';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  useMap,
} from '@vis.gl/react-google-maps';
import type * as GeoJSON from 'geojson';
import { useEffect } from 'react';

interface GoogleMapsProps {
  API_KEY: string;
  world_location?: WorldLocation;
}

export const WorldLocationViewer: React.FC<GoogleMapsProps> = ({
  API_KEY,
  world_location,
}) => {
  const defaultCenter = { lat: 48.8566, lng: 2.3522 };
  const defaultZoom = 5;

  return (
    <APIProvider apiKey={API_KEY} libraries={['geometry']}>
      <GoogleMap
        id="map"
        mapId="3fe9c0c47c132c089312908f"
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        disableDefaultUI
        clickableIcons={false}
        scrollwheel={true}
      >
        <WorldLocationDisplay world_location={world_location} />
      </GoogleMap>
    </APIProvider>
  );
};

const WorldLocationDisplay: React.FC<{
  world_location: WorldLocation | undefined;
}> = ({ world_location }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.data.forEach((feature) => {
      map.data.remove(feature);
    });

    if (!world_location) {
      map.setZoom(2);
      map.setCenter({ lat: 0, lng: 0 });
      return;
    }

    const geometry = world_location.geometry as unknown as GeoJSON.Geometry;
    const geojson = convertToGeoJson(geometry);
    if (!geojson) return;

    map.data.addGeoJson(geojson);
    map.data.setStyle({
      fillColor: '#FF0000',
      strokeColor: '#FF0000',
      strokeWeight: 1,
      fillOpacity: 0.2,
    });

    const point = world_location.centroid;
    const isPoint = world_location.geometry.type === 'Point';
    if (isPoint) {
      map.panTo({ lat: point[0], lng: point[1] });
      map.setZoom(12);
    } else {
      const bounds = new google.maps.LatLngBounds();
      const coords =
        geojson.type === 'FeatureCollection'
          ? geojson.features.flatMap((f) => getCoordinates(f.geometry))
          : getCoordinates(geojson.geometry);

      coords.forEach(([lng, lat]) => {
        bounds.extend({ lat, lng });
      });
      map.fitBounds(bounds);
    }
  }, [map, world_location]);

  if (!map || !world_location) return;

  const point = world_location.centroid;
  return world_location.geometry.type !== 'Point' ? (
    <AdvancedMarker position={{ lat: point[0], lng: point[1] }} />
  ) : null;
};

function convertToGeoJson(
  geometry:
    | GeoJSON.Geometry
    | GeoJSON.Feature
    | GeoJSON.FeatureCollection
    | null
    | undefined,
): GeoJSON.Feature | GeoJSON.FeatureCollection | null {
  if (!geometry) return null;

  if (geometry.type === 'Feature' || geometry.type === 'FeatureCollection') {
    return geometry;
  }

  return {
    type: 'Feature',
    geometry,
    properties: {},
  };
}

function getCoordinates(geometry: GeoJSON.Geometry): [number, number][] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates as [number, number]];
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates as [number, number][];
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates.flat() as [number, number][];
    case 'MultiPolygon':
      return geometry.coordinates.flat(2) as [number, number][];
    default:
      return [];
  }
}
