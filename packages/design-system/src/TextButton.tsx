import { styled } from 'tamagui';
import { BodyText } from './BodyText';
import { PressableFrame } from './PressableFrame';

type TextButtonTone = 'default' | 'danger';

const TextButtonFrame = styled(PressableFrame, {
  bg: 'transparent',
  minH: '11',
  justify: 'center',
  items: 'center',
  p: '2',
});

const TextButtonLabel = styled(BodyText, {
  textDecorationLine: 'underline',
  variants: {
    tone: {
      default: {},
      danger: {
        fontSize: '4 md:8',
        lineHeight: '6 md:10',
        fontWeight: '400',
        color: 'common-red',
      },
    },
  } as const,
});

type TextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: TextButtonTone;
};

export function TextButton({
  label,
  onPress,
  disabled = false,
  tone = 'default',
}: TextButtonProps) {
  return (
    <TextButtonFrame
      onPress={disabled ? undefined : onPress}
      aria-disabled={disabled}
      opacity={disabled ? 0.5 : 1}
    >
      <TextButtonLabel tone={tone}>{label}</TextButtonLabel>
    </TextButtonFrame>
  );
}
