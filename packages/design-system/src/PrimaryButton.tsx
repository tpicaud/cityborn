import { Button } from 'tamagui';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  return (
    <Button theme="brand" onPress={onPress}>
      {label}
    </Button>
  );
}
