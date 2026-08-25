import * as Ariakit from '@ariakit/react';
import { CircleAlert } from 'lucide-react';
import { Button } from './Button';
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
  const dialog = Ariakit.useDialogStore({ open, setOpen });

  return (
    <Dialog store={dialog} onClose={onExited}>
      <Ariakit.DialogHeading className="flex flex-col gap-2 items-center text-center">
        <CircleAlert
          strokeWidth={2.75}
          size={32}
          className="h-full text-red-700"
        />
        <p>{errorMessage}</p>
      </Ariakit.DialogHeading>
      <div className="flex justify-center gap-2 mt-4">
        <Button onClick={() => dialog.hide()} variant="primary">
          Fermer
        </Button>
      </div>
    </Dialog>
  );
}
