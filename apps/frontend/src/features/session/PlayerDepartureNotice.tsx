'use client';

import type { PlayerId } from '@cityborn/api';
import { Snackbar } from '@mui/material';

type PlayerDepartureNoticeProps = {
  departedPlayerIDs: PlayerId[];
};

export function PlayerDepartureNotice({
  departedPlayerIDs,
}: PlayerDepartureNoticeProps) {
  return (
    <Snackbar
      open={departedPlayerIDs.length > 0}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      message={
        <span className="flex flex-col">
          {departedPlayerIDs.map((playerID) => (
            <span key={playerID}>{playerID} a quitté la partie</span>
          ))}
        </span>
      }
    />
  );
}
