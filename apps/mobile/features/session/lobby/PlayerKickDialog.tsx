import type { PlayerId } from '@cityborn/api';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { View } from '@/components/ui/native/NativeComponents';

type PlayerKickDialogProps = {
  playerID: PlayerId | undefined;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function PlayerKickDialog({
  playerID,
  onCancel,
  onConfirm,
}: PlayerKickDialogProps) {
  return (
    <Dialog
      visible={playerID !== undefined}
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
