import { useState } from 'react';
import { Spinner, styled, Text, View } from 'tamagui';
import { PressableFrame } from './PressableFrame';
import { verticalGradient } from './palette';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'guess';

type ButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  small?: boolean;
  tabletDetail?: string;
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
      guess: {
        pb: '0.5 md:1',
        rounded: '3xl md:10',
        bg: 'cta-backdrop',
        borderColor: 'guess-cta-border',
        borderWidth: '2 md:4',
      },
    },
    small: {
      true: {
        p: '0.5 md:1',
        pb: '0.5 md:1',
        borderWidth: '0',
        bg: 'transparent',
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
      guess: {
        minH: '20 md:32',
        rounded: '8 md:10',
        backgroundImage: verticalGradient('guess'),
        y: 'press:1 md:press:1.5',
      },
    },
    compact: { true: { minH: '16 md:24', rounded: '8 md:10' } },
    small: {
      true: {
        minH: '9 md:20',
        px: '2',
        rounded: '5 md:3xl',
        boxShadow:
          'card-cta press:card-cta md:card-cta-tablet md:press:card-cta-tablet',
        y: 'press:0.5 md:press:1',
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
      guess: {
        fontSize: '8 md:11',
        lineHeight: '8 md:11',
        textTransform: 'uppercase',
        textShadow: 'cta-label',
      },
    },
    compact: { true: { fontSize: '6 md:8', lineHeight: '6 md:8' } },
    small: {
      true: {
        fontSize: '3 md:9',
        lineHeight: '3 md:9',
        textTransform: 'uppercase',
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
      guess: {},
    },
  } as const,
});

const GuessGlow = styled(View, {
  position: 'absolute',
  t: '2.5 md:4',
  b: '2.5 md:4',
  l: '2.5 md:4',
  r: '2.5 md:4',
  rounded: '6 md:9',
  borderWidth: '2 md:4',
  borderColor: 'cta-orange',
  bg: 'guess-cta-glow',
  boxShadow: 'guess-cta-glow md:guess-cta-glow-tablet',
  pointerEvents: 'none',
});

const GuessRim = styled(View, {
  position: 'absolute',
  t: '1 md:2',
  b: '1 md:2',
  l: '1 md:2',
  r: '1 md:2',
  rounded: '7 md:10',
  borderWidth: '2 md:4',
  borderColor: 'guess-cta-rim',
  pointerEvents: 'none',
});

const TabletDetail = styled(ButtonLabel, {
  display: 'none md:flex',
});

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  compact = false,
  small = false,
  tabletDetail,
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
    <ButtonSocket variant={variant} small={small} dimmed={disabled}>
      <ButtonFace
        variant={variant}
        compact={compact}
        small={small}
        pointerEvents={inactive ? 'none' : 'auto'}
        aria-disabled={inactive}
        aria-busy={busy}
        aria-label={label}
        onPress={inactive ? undefined : press}
      >
        {variant === 'guess' && (
          <>
            <GuessGlow />
            <GuessRim />
          </>
        )}
        <ButtonLabel
          variant={variant}
          compact={compact}
          small={small}
          hidden={busy}
        >
          {label}
        </ButtonLabel>
        {tabletDetail !== undefined && (
          <TabletDetail variant={variant} hidden={busy} aria-hidden>
            {tabletDetail}
          </TabletDetail>
        )}
        {busy && <ButtonSpinner variant={variant} />}
      </ButtonFace>
    </ButtonSocket>
  );
}
