import { useEffect, useState } from 'react';
import { GameConfig, Guess as GuessType, MapProps } from '@cityborn/types';
import { Game } from '@cityborn/types';
import { RoundStatus } from '@cityborn/types';
import RoundCountdown from './RoundCountdown';
import useGuess from '../hooks/useGuess';
import Overlay from './Overlay';
import Map from './Map';
import { View } from 'react-native';

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
  }, [game.state.currentRound?.status]);

  return (
    <View className="flex-1">
      {/* Maps */}
      <View className="absolute inset-0 z-0">
        <Map mapProps={mapProps} />
      </View>

      {/* Round Countdown */}
      {internalRoundStatus === 'countdown' && (
        <View className="absolute inset-0 z-20">
          <RoundCountdown
            onCountdownEnd={() => setInternalRoundStatus('guessing')}
          />
        </View>
      )}

      {/* Round */}
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
