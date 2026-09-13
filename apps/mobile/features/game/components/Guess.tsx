import type { PlayerId } from '@cityborn/api';
import { type GameComponentProps, useGameRound } from '@cityborn/client/game';
import { View } from 'react-native';
import GameMap from './Map';
import Overlay from './Overlay';
import RoundCountdown from './RoundCountdown';

type GuessProps = Pick<
  GameComponentProps,
  'game' | 'isHost' | 'handleGuess' | 'handleNextRound'
> & {
  localPlayerID: PlayerId;
};

const Guess: React.FC<GuessProps> = ({
  localPlayerID,
  game,
  isHost,
  handleGuess,
  handleNextRound,
}) => {
  const gameRound = useGameRound({ game, localPlayerID, handleGuess });

  return (
    <View className="flex-1">
      <View className="absolute inset-0 z-0">
        <GameMap mapProps={gameRound.mapProps} />
      </View>

      {gameRound.showCountdown && (
        <View className="absolute inset-0 z-20">
          <RoundCountdown onCountdownEnd={gameRound.handleCountdownEnd} />
        </View>
      )}

      {gameRound.showOverlay && (
        <View
          className="absolute inset-0 z-10 bg-transparent"
          pointerEvents="box-none"
        >
          <Overlay
            localPlayerID={localPlayerID}
            preGuess={gameRound.preGuess}
            game={game}
            isHost={isHost}
            handleGuess={handleGuess}
            handleIsTimeUp={gameRound.handleIsTimeUp}
            handleNextRound={handleNextRound}
          />
        </View>
      )}
    </View>
  );
};

export default Guess;
