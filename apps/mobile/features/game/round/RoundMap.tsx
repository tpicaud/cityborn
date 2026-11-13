import {
  type Coord,
  type FullGuessObject,
  type Guess,
  type Round,
  RoundStatus,
} from '@cityborn/api';
import {
  createRouteLabel,
  currentRevealedGuessObject,
  formatDistanceInKm,
  type MapProps,
  type RouteLabel,
} from '@cityborn/client/game';
import {
  type GuessObjectArea,
  guessObjectArea,
  guessObjectCenter,
} from '@cityborn/core';
import { AngledTag, brandColors } from '@cityborn/design-system';
import type { Position } from 'geojson';
import { Fragment, type RefObject, useEffect, useMemo, useRef } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';
import MapView, {
  type EdgePadding,
  type LatLng,
  Marker,
  type Point,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { View as TamaguiView } from 'tamagui';

type MarkerSize = {
  width: number;
  height: number;
};

const guessPinSource: ImageSourcePropType = require('@cityborn/design-system/assets/map/guess-pin.png');
const answerMarkerSource: ImageSourcePropType = require('@cityborn/design-system/assets/map/answer.png');
const guessPinSize: MarkerSize = { width: 40.6, height: 50.5 };
const answerMarkerSize: MarkerSize = { width: 28, height: 28 };
const guessPinTip: Point = { x: 0.5, y: 0.806 };
const answerMarkerCenter: Point = { x: 0.5, y: 0.429 };
const markerCenter: Point = { x: 0.5, y: 0.5 };
const otherPlayersRouteColor: string = `${brandColors['dark-blue']}99`;
const answerAreaFill: string = `${brandColors['secondary-cyan']}33`;
const otherPlayersOpacity: number = 0.6;
const routeDashPattern: number[] = [2, 2];

const zoomPadding: EdgePadding = { top: 120, right: 50, bottom: 240, left: 50 };

type CoordinatePressEvent = {
  nativeEvent: { coordinate: LatLng };
};

type CurrentRoundMapProps = Omit<MapProps, 'game'> & {
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

export default function RoundMap({ mapProps }: { mapProps: MapProps }) {
  const { game, ...roundMapProps }: MapProps = mapProps;
  const currentRound: Round | undefined = game.state.currentRound;
  const revealedGuessObject: FullGuessObject | undefined = useMemo(
    () => currentRevealedGuessObject(game),
    [game],
  );

  if (!currentRound) return null;

  return (
    <CurrentRoundMap
      {...roundMapProps}
      currentRound={currentRound}
      revealedGuessObject={revealedGuessObject}
    />
  );
}

function GuessPin({
  coordinate,
  opacity = 1,
}: {
  coordinate: Coord;
  opacity?: number;
}) {
  return (
    <Marker
      coordinate={toLatLng(coordinate)}
      anchor={guessPinTip}
      tappable={false}
    >
      <Image
        source={guessPinSource}
        style={{ ...guessPinSize, opacity }}
        resizeMode="contain"
      />
    </Marker>
  );
}

function DottedRoute({
  guess,
  answer,
  color,
}: {
  guess: Coord;
  answer: Coord;
  color: string;
}) {
  return (
    <Polyline
      coordinates={[toLatLng(guess), toLatLng(answer)]}
      strokeColor={color}
      strokeWidth={2}
      lineDashPattern={routeDashPattern}
      geodesic={false}
    />
  );
}

function LocalRoute({ guess, answer }: { guess: Guess; answer: Coord }) {
  const routeLabel: RouteLabel = createRouteLabel({
    guess: guess.coordinates,
    answer,
  });

  return (
    <>
      <DottedRoute
        guess={guess.coordinates}
        answer={answer}
        color={brandColors['dark-blue']}
      />
      <Marker
        coordinate={toLatLng(routeLabel.position)}
        anchor={markerCenter}
        tappable={false}
      >
        <TamaguiView w="32 md:48" h="32 md:48" items="center" justify="center">
          <AngledTag
            label={`${formatDistanceInKm(guess.distance)}km`}
            angleInDegrees={routeLabel.angleInDegrees}
          />
        </TamaguiView>
      </Marker>
    </>
  );
}

function AnswerArea({ guessObject }: { guessObject: FullGuessObject }) {
  const area: GuessObjectArea | undefined = guessObjectArea(guessObject);
  if (!area) return null;

  return areaOuterRings(area).map((outerRing: Position[]) => (
    <Polygon
      key={JSON.stringify(outerRing[0])}
      coordinates={outerRing.map(positionToLatLng)}
      strokeColor={brandColors['secondary-cyan']}
      fillColor={answerAreaFill}
      strokeWidth={1}
    />
  ));
}

function CurrentRoundMap({
  center,
  zoom,
  preGuess,
  localPlayerID,
  handlePreGuess,
  currentRound,
  revealedGuessObject,
}: CurrentRoundMapProps) {
  const mapRef: RefObject<MapView | null> = useRef<MapView>(null);
  const answer: Coord | undefined = useMemo(
    () => revealedGuessObject && guessObjectCenter(revealedGuessObject),
    [revealedGuessObject],
  );
  const localGuess: Guess | undefined =
    currentRound.playersGuesses?.[localPlayerID];
  const placedLocalGuess: Guess | undefined =
    localGuess && localGuess.distance !== -1 ? localGuess : undefined;
  const isShowingResults: boolean =
    currentRound.status === RoundStatus.SHOWING_RESULTS;

  const handleMapPress: (event: CoordinatePressEvent) => void = (event) => {
    const { latitude, longitude }: LatLng = event.nativeEvent.coordinate;
    handlePreGuess({ lat: latitude, lng: longitude });
  };

  const answerLat: number | undefined = answer?.lat;
  const answerLng: number | undefined = answer?.lng;
  const guessLat: number | undefined = placedLocalGuess?.coordinates.lat;
  const guessLng: number | undefined = placedLocalGuess?.coordinates.lng;

  useEffect(() => {
    if (
      !isShowingResults ||
      !mapRef.current ||
      answerLat === undefined ||
      answerLng === undefined
    ) {
      return;
    }
    const answerCoordinate: LatLng = toLatLng({
      lat: answerLat,
      lng: answerLng,
    });

    if (guessLat !== undefined && guessLng !== undefined) {
      mapRef.current.fitToCoordinates(
        [answerCoordinate, toLatLng({ lat: guessLat, lng: guessLng })],
        { edgePadding: zoomPadding, animated: true },
      );
      return;
    }

    mapRef.current.animateToRegion(
      {
        ...answerCoordinate,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      },
      100,
    );
  }, [answerLat, answerLng, guessLat, guessLng, isShowingResults]);

  const otherPlayersGuesses: [string, Guess][] = Object.entries(
    currentRound.playersGuesses ?? {},
  ).filter(
    ([playerID, guess]: [string, Guess]) =>
      playerID !== localPlayerID && guess.distance !== -1,
  );

  return (
    <View style={{ flex: 1 }}>
      <MapView
        key={currentRound.guessObjectId}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        zoomTapEnabled={false}
        showsPointsOfInterests={false}
        userInterfaceStyle="light"
        rotateEnabled={false}
        poiClickEnabled={false}
        initialCamera={{
          center: toLatLng(center),
          zoom,
          pitch: 0,
          heading: 0,
        }}
        onPoiClick={handleMapPress}
        onPress={handleMapPress}
      >
        {preGuess && <GuessPin coordinate={preGuess} />}

        {isShowingResults && revealedGuessObject && answer && (
          <>
            <AnswerArea guessObject={revealedGuessObject} />
            {otherPlayersGuesses.map(([playerID, guess]: [string, Guess]) => (
              <Fragment key={playerID}>
                <GuessPin
                  coordinate={guess.coordinates}
                  opacity={otherPlayersOpacity}
                />
                <DottedRoute
                  guess={guess.coordinates}
                  answer={answer}
                  color={otherPlayersRouteColor}
                />
              </Fragment>
            ))}
            {placedLocalGuess && (
              <>
                {!placedLocalGuess.win && (
                  <LocalRoute guess={placedLocalGuess} answer={answer} />
                )}
                <GuessPin coordinate={placedLocalGuess.coordinates} />
              </>
            )}
            <Marker
              coordinate={toLatLng(answer)}
              anchor={answerMarkerCenter}
              tappable={false}
            >
              <Image
                source={answerMarkerSource}
                style={answerMarkerSize}
                resizeMode="contain"
              />
            </Marker>
          </>
        )}
      </MapView>
    </View>
  );
}
