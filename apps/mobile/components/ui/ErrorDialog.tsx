import { colors } from '@cityborn/design-system';
import Dialog from './Dialog';
import { Icon } from './Icon';
import { Text, View } from './native/NativeComponents';

interface ErrorDialogProps {
  errorMessage: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onExited?: () => void;
}

function ErrorDialog({
  errorMessage,
  open,
  setOpen,
  onExited,
}: ErrorDialogProps) {
  const handleClose = () => {
    setOpen(false);
    onExited?.();
  };

  return (
    <Dialog visible={open} onClose={handleClose}>
      <View className="flex justify-center items-center gap-4">
        <Icon name="alert_fill" size={40} color={colors.destructive[500]} />
        <Text className="text-lg text-center">{errorMessage}</Text>
      </View>
    </Dialog>
  );
}

export default ErrorDialog;
