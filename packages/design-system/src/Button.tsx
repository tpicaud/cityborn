import { Spinner, styled, Text, View } from 'tamagui';
import { PressableFrame } from './PressableFrame';
import { verticalGradient } from './palette';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

const ButtonSocket = styled(View, {
  self: 'stretch',
  bg: 'cta-backdrop',
  borderWidth: '2',
  borderColor: 'cta-border',
  rounded: '3xl',
  variants: {
    variant: {
      primary: { pb: '1' },
      secondary: { pb: 3 },
      tertiary: { pb: 3 },
    },
    dimmed: {
      true: { opacity: 0.5 },
    },
  } as const,
});

const ButtonFace = styled(PressableFrame, {
  items: 'center',
  justify: 'center',
  px: '8',
  rounded: '8',
  variants: {
    variant: {
      primary: {
        py: '5',
        backgroundImage: verticalGradient('cta-orange'),
        boxShadow: 'relief-orange press:relief-pressed',
        y: 'press:1',
      },
      secondary: {
        py: '3.5',
        backgroundImage: verticalGradient('blue'),
        boxShadow: 'relief-blue press:relief-pressed',
        y: 'press:3px',
      },
      tertiary: {
        py: '3.5',
        backgroundImage: verticalGradient('yellow'),
        boxShadow: 'relief-yellow press:relief-pressed',
        y: 'press:3px',
      },
    },
  } as const,
});

const ButtonLabel = styled(Text, {
  fontFamily: 'body',
  fontSize: '6',
  lineHeight: '6',
  fontWeight: '700',
  color: 'white',
  text: 'center',
  select: 'none',
  variants: {
    hidden: {
      true: { opacity: 0 },
    },
  } as const,
});

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const inactive: boolean = disabled || loading;

  return (
    <ButtonSocket variant={variant} dimmed={disabled}>
      <ButtonFace
        variant={variant}
        pointerEvents={inactive ? 'none' : 'auto'}
        aria-disabled={inactive}
        aria-busy={loading}
        aria-label={label}
        onPress={inactive ? undefined : onPress}
      >
        <ButtonLabel hidden={loading}>{label}</ButtonLabel>
        {loading && <Spinner position="absolute" color="white" />}
      </ButtonFace>
    </ButtonSocket>
  );
}
