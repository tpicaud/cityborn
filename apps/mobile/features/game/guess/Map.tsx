import {
  type Coord,
  type FullGuessObject,
  type Round,
  RoundStatus,
} from '@cityborn/api';
import {
  currentRevealedGuessObject,
  type MapProps,
} from '@cityborn/client/game';
import {
  type GuessObjectArea,
  guessObjectArea,
  guessObjectCenter,
} from '@cityborn/core';
import { colors } from '@cityborn/design-system';
import type { Position } from 'geojson';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Image, View } from 'react-native';
import MapView, {
  type LatLng,
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

type RoundMapProps = Omit<MapProps, 'game'> & {
  currentRound: Round;
  revealedGuessObject: FullGuessObject | undefined;
};

function toLatLng(coord: Coord): LatLng {
  return { latitude: coord.lat, longitude: coord.lng };
}

function positionToLatLng([lng, lat]: Position): LatLng {
  return { latitude: lat, longitude: lng };
}

function areaOuterRings(area: GuessObjectArea): Position[][] {
  if (area.type === 'Polygon') return [area.coordinates[0]];
  return area.coordinates.map((polygon) => polygon[0]);
}

export default function GameMap({ mapProps }: { mapProps: MapProps }) {
  const { game, ...roundMapProps } = mapProps;
  const currentRound: Round | undefined = game.state.currentRound;

  if (!currentRound) return null;

  return (
    <RoundMap
      {...roundMapProps}
      currentRound={currentRound}
      revealedGuessObject={currentRevealedGuessObject(game)}
    />
  );
}

function RoundMap({
  center,
  zoom,
  preGuess,
  localPlayerID,
  handlePreGuess,
  currentRound,
  revealedGuessObject,
}: RoundMapProps) {
  const mapRef = useRef<MapView>(null);
  const answer: Coord | undefined = useMemo(
    () => revealedGuessObject && guessObjectCenter(revealedGuessObject),
    [revealedGuessObject],
  );
  const localGuess = currentRound.playersGuesses?.[localPlayerID];

  const handleMapPress = (event: {
    nativeEvent: { coordinate: LatLng };
  }): void => {
    if (currentRound.status !== RoundStatus.GUESSING || localGuess) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    handlePreGuess({ lat: latitude, lng: longitude });
  };

  const renderArea = (guessObject: FullGuessObject) => {
    const area: GuessObjectArea | undefined = guessObjectArea(guessObject);
    if (!area) return null;

    return areaOuterRings(area).map((outerRing) => (
      <Polygon
        key={JSON.stringify(outerRing[0])}
        coordinates={outerRing.map(positionToLatLng)}
        strokeColor="#FF0000"
        fillColor="rgba(255,0,0,0.2)"
        strokeWidth={1}
      />
    ));
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

  const renderOtherPlayers = (answer: Coord) => {
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
          {renderLine(guess.coordinates, answer, false)}
        </React.Fragment>
      );
    });
  };

  const focusMap = useCallback(() => {
    if (!mapRef.current || !answer) return;

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
  }, [answer, localGuess]);

  useEffect(() => {
    if (currentRound.status === RoundStatus.SHOWING_RESULTS) focusMap();
  }, [currentRound, focusMap]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        key={currentRound.guessObjectId}
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
        onPoiClick={handleMapPress}
        onPress={handleMapPress}
      >
        {preGuess && (
          <Marker coordinate={toLatLng(preGuess)} tappable={false} />
        )}

        {currentRound.status === RoundStatus.SHOWING_RESULTS &&
          revealedGuessObject &&
          answer && (
            <>
              <Marker
                coordinate={toLatLng(answer)}
                anchor={{ x: 0.5, y: 0.5 }}
                tappable={false}
              >
                <Image
                  source={require('../../../assets/maps/answer_marker.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              </Marker>
              {localGuess &&
                localGuess.distance !== -1 &&
                !localGuess.win &&
                renderLine(localGuess.coordinates, answer, true)}
              {renderOtherPlayers(answer)}
              {renderArea(revealedGuessObject)}
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
