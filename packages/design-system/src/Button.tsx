import { useState } from 'react';
import { Spinner, styled, Text, View } from 'tamagui';
import { PressableFrame } from './PressableFrame';
import { verticalGradient } from './palette';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline';

type ButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

const ButtonSocket = styled(View, {
  self: 'stretch',
  borderWidth: '2',
  variants: {
    variant: {
      primary: {
        pb: '1 md:1.5',
        rounded: '3xl md:10',
        bg: 'cta-backdrop',
        borderColor: 'cta-border',
      },
      secondary: {
        pb: '3px md:5px',
        rounded: '3xl md:10',
        bg: 'cta-backdrop',
        borderColor: 'cta-border',
      },
      tertiary: {
        pb: '3px md:5px',
        rounded: '3xl md:10',
        bg: 'cta-backdrop',
        borderColor: 'cta-border',
      },
      outline: {
        rounded: '7 md:9',
        bg: 'transparent',
        borderColor: 'outline-cta-ring',
      },
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
  variants: {
    variant: {
      primary: {
        minH: '20 md:32',
        rounded: '8 md:10',
        backgroundImage: verticalGradient('cta-orange'),
        boxShadow:
          'relief-orange press:relief-pressed md:relief-orange-tablet md:press:relief-pressed-tablet',
        y: 'press:1 md:press:1.5',
      },
      secondary: {
        minH: '16 md:24',
        rounded: '8 md:10',
        backgroundImage: verticalGradient('blue'),
        boxShadow:
          'relief-blue press:relief-pressed md:relief-blue-tablet md:press:relief-pressed-tablet',
        y: 'press:3px md:press:5px',
      },
      tertiary: {
        minH: '16 md:24',
        rounded: '8 md:10',
        backgroundImage: verticalGradient('yellow'),
        boxShadow:
          'relief-yellow press:relief-pressed md:relief-yellow-tablet md:press:relief-pressed-tablet',
        y: 'press:3px md:press:5px',
      },
      outline: {
        minH: '14 md:20',
        rounded: '6 md:9',
        borderWidth: '2',
        borderColor: 'outline-cta-border',
        bg: 'outline-cta-fill',
        opacity: 'press:0.8',
      },
    },
  } as const,
});

const ButtonLabel = styled(Text, {
  fontFamily: 'body',
  fontWeight: '700',
  color: 'white',
  text: 'center',
  select: 'none',
  variants: {
    variant: {
      primary: {
        fontSize: '7 md:10',
        lineHeight: '7 md:10',
      },
      secondary: {
        fontSize: '6 md:9',
        lineHeight: '6 md:9',
      },
      tertiary: {
        fontSize: '6 md:9',
        lineHeight: '6 md:9',
      },
      outline: {
        fontSize: '6 md:9',
        lineHeight: '6 md:9',
        fontWeight: '600',
        color: 'outline-cta-label',
      },
    },
    hidden: {
      true: { opacity: 0 },
    },
  } as const,
});

const ButtonSpinner = styled(Spinner, {
  position: 'absolute',
  color: 'white',
  variants: {
    variant: {
      primary: {},
      secondary: {},
      tertiary: {},
      outline: {
        color: 'outline-cta-label',
      },
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
  const [pending, setPending] = useState<boolean>(false);
  const busy: boolean = loading || pending;
  const inactive: boolean = disabled || busy;

  const press: () => Promise<void> = async (): Promise<void> => {
    const result: void | Promise<void> = onPress();
    if (!(result instanceof Promise)) {
      return;
    }
    setPending(true);
    try {
      await result;
    } finally {
      setPending(false);
    }
  };

  return (
    <ButtonSocket variant={variant} dimmed={disabled}>
      <ButtonFace
        variant={variant}
        pointerEvents={inactive ? 'none' : 'auto'}
        aria-disabled={inactive}
        aria-busy={busy}
        aria-label={label}
        onPress={inactive ? undefined : press}
      >
        <ButtonLabel variant={variant} hidden={busy}>
          {label}
        </ButtonLabel>
        {busy && <ButtonSpinner variant={variant} />}
      </ButtonFace>
    </ButtonSocket>
  );
}
