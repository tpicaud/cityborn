import type { PlayerId } from '@cityborn/api';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { View } from '@/components/ui/native/NativeComponents';

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
    <Dialog
      visible={isOpen}
      onClose={onCancel}
      message={`Exclure ${playerID} du lobby ?`}
      className="h-auto"
    >
      <View className="w-full flex-row gap-3">
        <Button
          label="Annuler"
          variant="outlined"
          className="w-auto flex-1"
          onPress={onCancel}
        />
        <Button
          label="Exclure"
          color="destructive"
          className="w-auto flex-1"
          onPress={onConfirm}
        />
      </View>
    </Dialog>
  );
}
