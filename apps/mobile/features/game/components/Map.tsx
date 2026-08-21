import {
  type Coord,
  type FullGuessObject,
  type Guess,
  type Round,
  RoundStatus,
} from '@cityborn/api';
import { calculatePoints, type MapProps } from '@cityborn/client';
import { colors } from '@cityborn/design-system';
import * as turf from '@turf/turf';
import type * as GeoJSON from 'geojson';
import React, { useCallback, useEffect, useRef } from 'react';
import { Appearance, Image, View } from 'react-native';
import MapView, {
  type LatLng,
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

export default function GameMap({ mapProps }: { mapProps: MapProps }) {
  const { center, zoom, preGuess, game, localPlayerID, handlePreGuess } =
    mapProps;

  const mapRef = useRef<MapView>(null);
  if (!game.state.currentRound) {
    throw new Error('GameMap rendered without an active round');
  }
  const currentRound: Round = game.state.currentRound;
  const guessObject = (game.state.guessObjects ?? []).find(
    (obj: FullGuessObject) => obj.id === currentRound.guessObjectId,
  ) as FullGuessObject;

  const getCenterOfGuessObject = useCallback(
    (guessObject: FullGuessObject): Coord => ({
      lat: guessObject.world_location.centroid[0],
      lng: guessObject.world_location.centroid[1],
    }),
    [],
  );

  const getDistanceTo = (lat: number, lng: number): number => {
    if (isGeoJSON(guessObject) && hasWin({ lat, lng }, guessObject)) return 0;

    const answer = getCenterOfGuessObject(guessObject);
    const from = turf.point([lng, lat]);
    const to = turf.point([answer.lng, answer.lat]);
    return turf.distance(from, to, { units: 'kilometers' });
  };

  function toLatLng(coord: Coord): LatLng {
    return {
      latitude: coord.lat,
      longitude: coord.lng,
    };
  }

  const handleMapPress = (event: { nativeEvent: { coordinate: LatLng } }) => {
    const { coordinate } = event.nativeEvent;
    const distance = getDistanceTo(coordinate.latitude, coordinate.longitude);
    const points = calculatePoints(distance);

    const newGuess: Guess = {
      coordinates: { lat: coordinate.latitude, lng: coordinate.longitude },
      distance,
      points,
      win: distance === 0,
    };

    handlePreGuess(newGuess);
  };

  const isGeoJSON = (guessObject: FullGuessObject) => {
    const type = guessObject.world_location.geometry.type;
    return type === 'Polygon' || type === 'MultiPolygon';
  };

  const hasWin = (point: Coord, guessObject: FullGuessObject) => {
    try {
      const geoJson = guessObject.world_location.geometry;
      if (geoJson.type === 'Point') return false;
      const turfPoint = turf.point([point.lng, point.lat]);
      return turf.booleanPointInPolygon(
        turfPoint,
        geoJson as unknown as GeoJSON.Polygon | GeoJSON.MultiPolygon,
      );
    } catch {
      return false;
    }
  };

  const renderPolygons = () => {
    if (!isGeoJSON(guessObject)) return null;

    const geometry = guessObject.world_location.geometry;
    if (geometry.type === 'Polygon') {
      const polygonCoords = (geometry.coordinates[0] as number[][]).map(
        ([lng, lat]) => ({ latitude: lat, longitude: lng }),
      );

      return (
        <Polygon
          coordinates={polygonCoords}
          strokeColor="#FF0000"
          fillColor="rgba(255,0,0,0.2)"
          strokeWidth={1}
        />
      );
    } else if (geometry.type === 'MultiPolygon') {
      return (geometry.coordinates as number[][][][]).map((polygon) => (
        <Polygon
          key={JSON.stringify(polygon[0][0])}
          coordinates={polygon[0].map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }))}
          strokeColor="#FF0000"
          fillColor="rgba(255,0,0,0.2)"
          strokeWidth={1}
        />
      ));
    }
    return null;
  };

  const renderLine = (guess: Coord, answer: Coord, isLocalPlayer: boolean) => (
    <Polyline
      coordinates={[
        { latitude: guess.lat, longitude: guess.lng },
        { latitude: answer.lat, longitude: answer.lng },
      ]}
      strokeColor={
        isLocalPlayer ? colors.primary[500] : colors.foreground.DEFAULT
      }
      fillColor={
        isLocalPlayer ? colors.primary[500] : colors.foreground.DEFAULT
      }
      strokeWidth={isLocalPlayer ? 4 : 1}
      geodesic={true}
    />
  );

  const renderOtherPlayers = () => {
    const guesses = currentRound.playersGuesses
      ? Object.entries(currentRound.playersGuesses).filter(
          ([playerID]) => playerID !== localPlayerID,
        )
      : [];

    return guesses.map(([playerID, guess]) => {
      if (guess.distance === -1) return null;
      return (
        <React.Fragment key={playerID}>
          <Marker
            coordinate={{
              latitude: guess.coordinates.lat,
              longitude: guess.coordinates.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tappable={false}
          >
            <Image
              source={require('../../../assets/maps/player.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </Marker>
          {renderLine(
            guess.coordinates,
            getCenterOfGuessObject(guessObject),
            false,
          )}
        </React.Fragment>
      );
    });
  };

  const localGuess = currentRound.playersGuesses?.[localPlayerID];

  const focusMap = useCallback(() => {
    if (!mapRef.current) return;

    const answer = getCenterOfGuessObject(guessObject);
    const coords: LatLng[] = [{ latitude: answer.lat, longitude: answer.lng }];

    if (localGuess && localGuess.distance !== -1) {
      coords.push({
        latitude: localGuess.coordinates.lat,
        longitude: localGuess.coordinates.lng,
      });

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: answer.lat,
        longitude: answer.lng,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      },
      100,
    );
  }, [guessObject, localGuess, getCenterOfGuessObject]);

  useEffect(() => {
    if (currentRound.status === RoundStatus.SHOWING_RESULTS) focusMap();
  }, [currentRound, focusMap]);
  const _theme = Appearance.getColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <MapView
        key={guessObject.id}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        zoomTapEnabled={false}
        showsPointsOfInterests={false}
        customMapStyle={lightMapStyle}
        userInterfaceStyle="light"
        rotateEnabled={false}
        poiClickEnabled={false}
        onPanDrag={() => {}}
        initialCamera={{
          center: {
            latitude: center.lat,
            longitude: center.lng,
          },
          zoom,
          pitch: 0,
          heading: 0,
        }}
        onPoiClick={(e) => handleMapPress(e)}
        onPress={(e) => {
          if (currentRound.status === RoundStatus.GUESSING && !localGuess)
            handleMapPress(e);
        }}
      >
        {preGuess && preGuess.distance !== -1 && (
          <Marker
            coordinate={{
              latitude: preGuess.coordinates.lat,
              longitude: preGuess.coordinates.lng,
            }}
            tappable={false}
          />
        )}

        {currentRound.status === RoundStatus.SHOWING_RESULTS && (
          <Marker
            coordinate={toLatLng(getCenterOfGuessObject(guessObject))}
            anchor={{ x: 0.5, y: 0.5 }}
            tappable={false}
          >
            <Image
              source={require('../../../assets/maps/answer_marker.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </Marker>
        )}

        {currentRound.status === RoundStatus.SHOWING_RESULTS && (
          <>
            {localGuess &&
              localGuess.distance !== -1 &&
              !localGuess.win &&
              renderLine(
                localGuess.coordinates,
                getCenterOfGuessObject(guessObject),
                true,
              )}
            {renderOtherPlayers()}
            {renderPolygons()}
          </>
        )}
      </MapView>
    </View>
  );
}

const lightMapStyle = [
  {
    featureType: 'administrative',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on',
      },
    ],
  },
];
