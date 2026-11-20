import type { Game, PlayerId } from '@cityborn/api';
import { createGameResults, type GameResults } from '@cityborn/client/game';
import { Button, ScoreTable, TrophyOverlay } from '@cityborn/design-system';

type ResultsProps = {
  game: Game;
  localPlayerID: PlayerId;
  isHost: boolean;
  handlePlayAgain: () => Promise<void>;
  handleExitGame: () => Promise<void>;
};

export function Results({
  game,
  localPlayerID,
  isHost,
  handlePlayAgain,
  handleExitGame,
}: ResultsProps) {
  const gameResults: GameResults = createGameResults({ game, localPlayerID });

  return (
    <TrophyOverlay
      score={gameResults.totalPoints}
      actions={
        <>
          <Button
            label="Rejouer"
            disabled={!isHost}
            onPress={handlePlayAgain}
          />
          <Button
            variant="secondary"
            label="Menu principal"
            onPress={handleExitGame}
          />
        </>
      }
    >
      {gameResults.ranking && (
        <ScoreTable
          title="Classement"
          columns={{ label: 'Pseudo', score: 'Points' }}
          rows={gameResults.ranking}
        />
      )}
      {gameResults.rounds.length > 0 && (
        <ScoreTable
          title={gameResults.ranking ? 'Tes manches' : undefined}
          columns={{ label: 'Nom', detail: 'Distance', score: 'Points' }}
          rows={gameResults.rounds}
        />
      )}
    </TrophyOverlay>
  );
}
