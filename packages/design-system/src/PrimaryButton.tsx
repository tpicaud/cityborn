import { Button } from 'tamagui';
import { colors } from './colors';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  return (
    <Button
      color="white"
      style={{
        backgroundColor: colors.primary.DEFAULT,
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
      }}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
