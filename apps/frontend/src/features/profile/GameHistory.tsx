'use client';

import {
  type ProfileGame,
  type ProfileGames,
  useProfileGames,
} from '@cityborn/client/profile';
import {
  BodyText,
  Panel,
  PanelTitle,
  ScoreList,
  ScoreRow,
} from '@cityborn/design-system';
import { Spinner } from 'tamagui';

export function GameHistory() {
  const { games, isLoading }: ProfileGames = useProfileGames();

  return (
    <Panel>
      <PanelTitle>Historique des parties</PanelTitle>
      {isLoading ? (
        <Spinner color="white" />
      ) : games.length === 0 ? (
        <BodyText>Aucune partie pour l’instant. Le monde t’attend.</BodyText>
      ) : (
        <ScoreList>
          {games.map(({ id, title, playedOn, points }: ProfileGame) => (
            <ScoreRow
              key={id}
              title={title}
              caption={playedOn}
              score={String(points)}
              unit="pts"
            />
          ))}
        </ScoreList>
      )}
    </Panel>
  );
}
