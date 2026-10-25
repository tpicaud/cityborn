import { Box } from '@mui/material';
import Button from '@/components/ui/buttons/Button';
import { Dialog } from '@/components/ui/dialogs/Dialog';

type ConnectionLostDialogProps = {
  onRetry: () => void;
  onExit: () => void;
};

export function ConnectionLostDialog({
  onRetry,
  onExit,
}: ConnectionLostDialogProps) {
  return (
    <Dialog open={true}>
      <Box className="flex flex-col justify-center items-center gap-5 px-12 py-8 bg-slate-100 shadow-xl rounded-2xl">
        <p>Connexion à la session perdue</p>
        <Box className="flex gap-3">
          <Button variant="outlined" onClick={onExit}>
            Quitter
          </Button>
          <Button variant="contained" onClick={onRetry}>
            Réessayer
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
