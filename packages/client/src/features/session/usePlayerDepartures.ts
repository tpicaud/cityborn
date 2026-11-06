'use client';

import type { PlayerId, SessionPlayer } from '@cityborn/api';
import { type RefObject, useEffect, useRef, useState } from 'react';

const PLAYER_DEPARTURE_NOTICE_MS: number = 4000;

export function departedPlayerIDs({
  previousPlayers,
  players,
}: {
  previousPlayers: SessionPlayer[];
  players: SessionPlayer[];
}): PlayerId[] {
  return previousPlayers
    .map((player) => player.username)
    .filter(
      (playerID: PlayerId) =>
        !players.some((player) => player.username === playerID),
    );
}

export function usePlayerDepartures(
  players: SessionPlayer[] | undefined,
): PlayerId[] {
  const previousPlayers: RefObject<SessionPlayer[] | undefined> = useRef<
    SessionPlayer[] | undefined
  >(undefined);
  const [announcedPlayerIDs, setAnnouncedPlayerIDs] = useState<PlayerId[]>([]);

  useEffect(() => {
    const comparedPlayers: SessionPlayer[] | undefined =
      previousPlayers.current;
    previousPlayers.current = players;
    if (!comparedPlayers || !players) return;

    const departures: PlayerId[] = departedPlayerIDs({
      previousPlayers: comparedPlayers,
      players,
    });
    if (departures.length > 0) setAnnouncedPlayerIDs(departures);
  }, [players]);

  useEffect(() => {
    if (announcedPlayerIDs.length === 0) return;
    const timeout: ReturnType<typeof setTimeout> = setTimeout(
      () => setAnnouncedPlayerIDs([]),
      PLAYER_DEPARTURE_NOTICE_MS,
    );
    return () => clearTimeout(timeout);
  }, [announcedPlayerIDs]);

  return announcedPlayerIDs;
}
