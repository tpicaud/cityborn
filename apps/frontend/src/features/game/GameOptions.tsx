'use client';

import {
  type GameOptionsMenu,
  useGameOptionsMenu,
} from '@cityborn/client/game';
import { Settings } from '@mui/icons-material';
import { Box } from '@mui/material';
import { useEffect } from 'react';
import Button from '@/components/ui/buttons/Button';
import LoadingButton from '@/components/ui/buttons/LoadingButton';
import { Dialog } from '@/components/ui/dialogs/Dialog';

type GameOptionsProps = {
  handleLeaveGame: () => Promise<void>;
};

function useBrowserBackInterception(onBack: () => void): void {
  useEffect(() => {
    window.history.pushState(window.history.state, '', window.location.href);
    const handlePopState = (): void => {
      window.history.pushState(window.history.state, '', window.location.href);
      onBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);
}

export function GameOptions({ handleLeaveGame }: GameOptionsProps) {
  const optionsMenu: GameOptionsMenu = useGameOptionsMenu({
    leaveGame: handleLeaveGame,
  });
  useBrowserBackInterception(optionsMenu.open);

  return (
    <>
      <div className="absolute top-2 left-6 z-[1300]">
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Settings />}
          onClick={optionsMenu.open}
          sx={{ borderRadius: 6, fontWeight: 'bold' }}
        >
          Options
        </Button>
      </div>

      <Dialog
        open={optionsMenu.step !== 'closed'}
        onClose={
          optionsMenu.step === 'options'
            ? optionsMenu.resume
            : optionsMenu.cancelLeave
        }
      >
        <Box className="flex flex-col items-center gap-5 px-12 py-8 bg-slate-100 shadow-xl rounded-2xl">
          {optionsMenu.step === 'leaveConfirmation' ? (
            <>
              <p className="text-center">
                Quitter la partie ? Ta progression sera perdue.
              </p>
              <Box className="flex gap-3">
                <Button variant="outlined" onClick={optionsMenu.cancelLeave}>
                  Annuler
                </Button>
                <LoadingButton
                  variant="contained"
                  color="error"
                  onClick={optionsMenu.confirmLeave}
                >
                  Quitter
                </LoadingButton>
              </Box>
            </>
          ) : (
            <>
              <p className="text-xl font-bold">Options</p>
              <Box className="flex flex-col gap-3 w-full">
                <Button variant="contained" onClick={optionsMenu.resume}>
                  Reprendre
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={optionsMenu.requestLeave}
                >
                  Quitter
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Dialog>
    </>
  );
}
