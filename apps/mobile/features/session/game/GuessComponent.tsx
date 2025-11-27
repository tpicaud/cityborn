import { useEffect, useState } from 'react';
import { Guess, MapProps, Session } from '@cityborn/types';
import { Game } from '@cityborn/types';
import { RoundStatus } from '@cityborn/types';
import RoundCountdownComponent from './RoundCountdown';
import useGuess from './hooks/useGuess';
import OverlayComponent from './OverlayComponent';
import MapComponent from './MapComponent';
import { View, StyleSheet } from 'react-native';

interface GuessComponentProps {
  localPlayerID: string;
  session: Session;
  game: Game;
  handleGuess: (guess: Guess) => void;
  handleNextRound: () => void;
}

const GuessComponent: React.FC<GuessComponentProps> = ({
  localPlayerID,
  session,
  game,
  handleGuess,
  handleNextRound,
}) => {
  const { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp } =
    useGuess(handleGuess);
  const [internalRoundStatus, setInternalRoundStatus] = useState<
    'countdown' | 'guessing' | 'results'
  >('countdown');

  // Map properties
  const mapProps: MapProps = {
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 2,
    preGuess,
    localPlayerID,
    game,
    handlePreGuess,
  };

  useEffect(() => {
    switch (game.state.currentRound?.status) {
      case RoundStatus.GUESSING:
        resetPreGuess();
        setInternalRoundStatus('countdown');
        break;

      case RoundStatus.SHOWING_RESULTS:
        setInternalRoundStatus('results');
        break;

      default:
        resetPreGuess();
        setInternalRoundStatus('countdown');
        break;
    }
  }, [game.state.currentRound?.status]);

  return (
    <View className="flex-1">
      <View className="absolute inset-0 z-0">
        <MapComponent mapProps={mapProps} />
      </View>

      {internalRoundStatus === 'countdown' && (
        <View className="absolute inset-0 z-20">
          <RoundCountdownComponent
            onCountdownEnd={() => setInternalRoundStatus('guessing')}
          />
        </View>
      )}

      {(internalRoundStatus === 'guessing' ||
        internalRoundStatus === 'results') &&
        !(
          internalRoundStatus === 'results' &&
          game.state.currentRound?.status === RoundStatus.GUESSING
        ) && (
          <View
            className="absolute inset-0 z-10 bg-transparent"
            pointerEvents="box-none"
          >
            <OverlayComponent
              localPlayerID={localPlayerID}
              preGuess={preGuess}
              session={session}
              game={game}
              handleGuess={handleGuess}
              handleIsTimeUp={handleIsTimeUp}
              handleNextRound={handleNextRound}
            />
          </View>
        )}
    </View>
  );
};

export default GuessComponent;
