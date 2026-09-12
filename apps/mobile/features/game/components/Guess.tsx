import type { Game, Guess as GuessType } from '@cityborn/api';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type MapProps,
} from '@cityborn/client/game';
import { useGuessRound } from '@cityborn/client/game/react';
import { View } from 'react-native';
import GameMap from './Map';
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
  const {
    preGuess,
    phase,
    isOverlayVisible,
    handlePreGuess,
    handleIsTimeUp,
    handleCountdownEnd,
  } = useGuessRound(game.state.currentRound?.status, handleGuess);

  const mapProps: MapProps = {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    preGuess,
    localPlayerID,
    game,
    handlePreGuess,
  };

  return (
    <View className="flex-1">
      <View className="absolute inset-0 z-0">
        <GameMap mapProps={mapProps} />
      </View>

      {phase === 'countdown' && (
        <View className="absolute inset-0 z-20">
          <RoundCountdown onCountdownEnd={handleCountdownEnd} />
        </View>
      )}

      {isOverlayVisible && (
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
