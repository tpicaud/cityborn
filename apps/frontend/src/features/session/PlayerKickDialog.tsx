import type { PlayerId } from '@cityborn/api';
import { Box } from '@mui/material';
import Button from '@/components/ui/buttons/Button';
import LoadingButton from '@/components/ui/buttons/LoadingButton';
import { Dialog } from '@/components/ui/dialogs/Dialog';

type PlayerKickDialogProps = {
  isOpen: boolean;
  playerID: PlayerId | undefined;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function PlayerKickDialog({
  isOpen,
  playerID,
  onCancel,
  onConfirm,
}: PlayerKickDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <Box className="flex flex-col items-center gap-5 px-12 py-8 bg-slate-100 shadow-xl rounded-2xl">
        <p className="text-center">Exclure {playerID} du lobby ?</p>
        <Box className="flex gap-3">
          <Button variant="outlined" onClick={onCancel}>
            Annuler
          </Button>
          <LoadingButton variant="contained" color="error" onClick={onConfirm}>
            Exclure
          </LoadingButton>
        </Box>
      </Box>
    </Dialog>
  );
}
