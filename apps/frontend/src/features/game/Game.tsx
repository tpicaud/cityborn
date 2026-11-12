'use client';

import type { Session } from '@cityborn/api';
import {
  createGameDisplay,
  type GameComponentProps,
  type GameDisplay,
  type GameOptionsMenu,
  useGameOptionsMenu,
} from '@cityborn/client/game';
import {
  ActionPrompt,
  Button,
  LoadingScreen,
  Screen,
} from '@cityborn/design-system';
import { Backdrop } from '@mui/material';
import { GameOptions } from './GameOptions';
import Results from './Results';
import { Round } from './round/Round';

export const Game = ({
  localPlayerID,
  isHost,
  session,
  game,
  handleGuess,
  handleNextRound,
  handleEndGame,
  handlePlayAgain,
  handleExitGame,
  handleLeaveGame,
}: GameComponentProps & {
  session: Session;
}) => {
  const gameDisplay: GameDisplay = createGameDisplay(game, localPlayerID);
  const optionsMenu: GameOptionsMenu = useGameOptionsMenu({
    leaveGame: handleLeaveGame,
  });

  if (gameDisplay.state === 'loading') return <LoadingScreen />;
  if (gameDisplay.state === 'unavailable') {
    return (
      <Screen>
        <ActionPrompt prompt="La partie est déjà en cours">
          <Button compact label="Menu" onPress={handleExitGame} />
        </ActionPrompt>
      </Screen>
    );
  }
  const activePlayerID = gameDisplay.localPlayerID;

  return (
    <>
      <Round
        localPlayerID={activePlayerID}
        isHost={isHost}
        game={game}
        gameDisplay={gameDisplay}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
        onOpenOptions={gameDisplay.showOptions ? optionsMenu.open : undefined}
      />
      {gameDisplay.showOptions && <GameOptions optionsMenu={optionsMenu} />}

      {gameDisplay.showResults && (
        <div className="absolute inset-0">
          <div className="flex flex-row w-full h-full items-center justify-center">
            <Backdrop open={true}>
              <div className="w-[80%]">
                <Results
                  game={game}
                  localPlayerID={activePlayerID}
                  isHost={isHost}
                  mode={session.mode}
                  handleEndGame={handleEndGame}
                  handlePlayAgain={handlePlayAgain}
                  handleExitGame={handleExitGame}
                />
              </div>
            </Backdrop>
          </div>
        </div>
      )}
    </>
  );
};
