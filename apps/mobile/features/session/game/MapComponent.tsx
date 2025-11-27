import React, { useEffect, useRef } from 'react';
import { View, Image } from 'react-native';
import MapView, { Marker, Polygon, Polyline, LatLng } from 'react-native-maps';
import * as turf from '@turf/turf';
import {
  MapProps,
  Coord,
  Guess,
  GuessObject,
  Round,
  RoundStatus,
} from '@cityborn/types';
import { calculatePoints } from '@cityborn/utils';

export default function MapComponent({ mapProps }: { mapProps: MapProps }) {
  const { center, zoom, preGuess, game, localPlayerID, handlePreGuess } =
    mapProps;

  const mapRef = useRef<MapView>(null);
  const currentRound: Round = game.state.currentRound!;
  const guessObject: GuessObject = game.state.guessObjects!.find(
    (obj: GuessObject) => obj.id === currentRound.guessObjectId,
  )!;

  const getCenterOfGuessObject = (guessObject: GuessObject): Coord => ({
    lat: guessObject.world_location?.centroid![0]!,
    lng: guessObject.world_location?.centroid![1]!,
  });

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

  function toCoord(latlng: LatLng): Coord {
    return {
      lat: latlng.latitude,
      lng: latlng.longitude,
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

  const isGeoJSON = (guessObject: GuessObject) => {
    const type = guessObject.world_location?.geometry?.type;
    return type === 'Polygon' || type === 'MultiPolygon';
  };

  const hasWin = (point: Coord, guessObject: GuessObject) => {
    try {
      const geoJson = guessObject.world_location?.geometry!;
      if (geoJson.type === 'Point') return false;
      const turfPoint = turf.point([point.lng, point.lat]);
      return turf.booleanPointInPolygon(turfPoint, geoJson as any);
    } catch {
      return false;
    }
  };

  const renderPolygons = () => {
    if (!isGeoJSON(guessObject)) return null;

    const geometry = guessObject.world_location!.geometry!;
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
      return geometry.coordinates.map((polygon: any, idx: number) => (
        <Polygon
          key={idx}
          coordinates={polygon[0].map(([lng, lat]: [number, number]) => ({
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
      strokeColor={isLocalPlayer ? '#0000FF' : '#616161'}
      strokeWidth={isLocalPlayer ? 3 : 2}
    />
  );

  const renderOtherPlayers = () => {
    const guesses = currentRound.playersGuesses
      ? Object.entries(currentRound.playersGuesses)
          .filter(([playerID]) => playerID !== localPlayerID)
          .map(([, guess]) => guess)
      : [];

    return guesses.map((guess, index) => {
      if (guess.distance === -1) return null;
      return (
        <React.Fragment key={index}>
          <Marker
            coordinate={{
              latitude: guess.coordinates.lat,
              longitude: guess.coordinates.lng,
            }}
          />
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

  const focusMap = () => {
    if (!mapRef.current) return;
    const answer = getCenterOfGuessObject(guessObject);
    const coords: LatLng[] = [{ latitude: answer.lat, longitude: answer.lng }];
    if (localGuess && localGuess.distance !== -1)
      coords.push({
        latitude: localGuess.coordinates.lat,
        longitude: localGuess.coordinates.lng,
      });
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  useEffect(() => {
    if (currentRound.status === RoundStatus.SHOWING_RESULTS) focusMap();
  }, [currentRound]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        key={guessObject.id}
        ref={mapRef}
        provider="google"
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.lat || 0,
          longitude: center.lng || 0,
          latitudeDelta: 50,
          longitudeDelta: 50,
        }}
        onPress={(e) => {
          if (currentRound.status === RoundStatus.GUESSING && !localGuess)
            handleMapPress(e);
        }}
      >
        {/* Pre-guess marker */}
        {preGuess && preGuess.distance !== -1 && (
          <Marker
            coordinate={{
              latitude: preGuess.coordinates.lat,
              longitude: preGuess.coordinates.lng,
            }}
          />
        )}

        {/* Answer marker */}
        {currentRound.status === RoundStatus.SHOWING_RESULTS && (
          // <Marker
          //   coordinate={toLatLng(getCenterOfGuessObject(guessObject))}
          //   anchor={{ x: 0.5, y: 0.5 }}
          //   icon={require('@/assets/maps/answer_marker.png')}
          // />
          <Marker
            coordinate={toLatLng(getCenterOfGuessObject(guessObject))}
            anchor={{ x: 0.5, y: 0.5 }}
            calloutAnchor={{ x: 0, y: 50 }}
            tracksViewChanges={true}
          >
            <Image
              source={require('@/assets/maps/answer_marker.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </Marker>
        )}

        {/* Local player guess line */}
        {currentRound.status === RoundStatus.SHOWING_RESULTS &&
          localGuess?.distance !== -1 &&
          !localGuess?.win && (
            <>
              {renderLine(
                localGuess!.coordinates,
                getCenterOfGuessObject(guessObject),
                true,
              )}
              {renderOtherPlayers()}

              {/* Polygons / GeoJSON */}
              {renderPolygons()}
            </>
          )}
      </MapView>
    </View>
  );
}
