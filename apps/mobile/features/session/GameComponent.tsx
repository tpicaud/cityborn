import { View } from '@/components/ui/native/NativeComponents';
import { Game, Guess, Session } from '@cityborn/types';

export const GameComponent = ({
  localPlayerID,
  isHost,
  session,
  game,
  handleGuess,
  handleNextRound,
  handleEndGame,
  handlePlayAgain,
  handleExitGame,
}: {
  localPlayerID: string | undefined;
  isHost: boolean;
  session: Session;
  game: Game;
  handleGuess: (guess: Guess) => Promise<void>;
  handleNextRound: () => Promise<void>;
  handleEndGame: () => Promise<void>;
  handlePlayAgain: () => Promise<void>;
  handleExitGame: () => Promise<void>;
}) => {
  return <View></View>;
};
