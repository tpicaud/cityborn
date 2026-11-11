import { styled } from 'tamagui';
import { BodyText } from './BodyText';
import { PressableFrame } from './PressableFrame';

const TextButtonFrame = styled(PressableFrame, {
  bg: 'transparent',
  minH: '11',
  justify: 'center',
  items: 'center',
  p: '2',
});

type TextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function TextButton({
  label,
  onPress,
  disabled = false,
}: TextButtonProps) {
  return (
    <TextButtonFrame
      onPress={disabled ? undefined : onPress}
      aria-disabled={disabled}
      opacity={disabled ? 0.5 : 1}
    >
      <BodyText textDecorationLine="underline">{label}</BodyText>
    </TextButtonFrame>
  );
}
