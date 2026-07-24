import { type Game, type Guess as GuessType, RoundStatus } from '@cityborn/api';
import type { MapProps } from '@cityborn/client';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import useGuess from '../hooks/useGuess';
import Map from './Map';
import Overlay from './Overlay';
import RoundCountdown from './RoundCountdown';

interface GuessProps {
  localPlayerID: string;
  game: Game;
  isHost: boolean;
  handleGuess: (guess: GuessType) => void;
  handleNextRound: () => void;
}

const Guess: React.FC<GuessProps> = ({
  localPlayerID,
  game,
  isHost,
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
  }, [game.state.currentRound?.status, resetPreGuess]);

  return (
    <View className="flex-1">
      <View className="absolute inset-0 z-0">
        <Map mapProps={mapProps} />
      </View>

      {internalRoundStatus === 'countdown' && (
        <View className="absolute inset-0 z-20">
          <RoundCountdown
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
            <Overlay
              localPlayerID={localPlayerID}
              preGuess={preGuess}
              game={game}
              isHost={isHost}
              handleGuess={handleGuess}
              handleIsTimeUp={handleIsTimeUp}
              handleNextRound={handleNextRound}
            />
          </View>
        )}
    </View>
  );
};

export default Guess;
