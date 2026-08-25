import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import { DialogContent, DialogTitle } from '@mui/material';
import { Dialog } from './Dialog';

interface ErrorDialogProps {
  errorMessage: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onExited?: () => void;
}

export function ErrorDialog({
  errorMessage,
  open,
  setOpen,
  onExited,
}: ErrorDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      slotProps={{
        transition: {
          onExited,
        },
      }}
      fullWidth
      maxWidth="xs"
      sx={{
        '& .MuiDialog-paper': {
          width: '90%',
          maxWidth: 400,
          height: 'auto',
          borderRadius: '1rem',
        },
      }}
    >
      <DialogTitle className="flex justify-center items-center">
        <ErrorOutlineIcon color="error" />
      </DialogTitle>
      <DialogContent className="flex flex-col items-center justify-center">
        <p className="text-center">{errorMessage}</p>
      </DialogContent>
    </Dialog>
  );
}
