'use client';

import { CircularProgress, Button as MuiButton } from '@mui/material';
import { ReactNode, useState } from 'react';
import clsx from 'clsx';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'auto';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

// const className = 'text-l'

function applyBreakpoint(classes: string, prefix: 'sm' | 'md' | 'lg') {
  return classes
    .split(' ')
    .map((cls) => `${prefix}:${cls}`)
    .join(' ');
}

// Base styles
const baseButtonStyle =
  'transition-transform duration-200 ease-in-out transform hover:scale-105 active:scale-95';
const baseTextStyle =
  'font-sans font-bold text-neutral text-shadow-[0_0px_10px_rgba(0_0_0_/_0.65)]';

// Variant styles
const variantStyles: Record<string, string> = {
  primary: 'bg-gradient-primary',
  secondary: 'bg-gradient-secondary',
  accent: 'bg-gradient-accent',
  disabled: 'bg-neutral-600',
};

// Disabled style
const disabledStyle = 'bg-neutral-700 shadow-none filter grayscale';

// Size styles
const sizeStyles: Record<string, string> = {
  sm: 'px-5 py-2 min-w-[4rem] min-h-[1rem] rounded-lg shadow-[0_0_10px_5px_rgba(0,0,0,0.15)]',
  md: 'px-9 py-2 min-w-[5rem] min-h-[2rem] rounded-xl shadow-[0_0_15px_5px_rgba(0,0,0,0.2)]',
  lg: 'px-12 py-2 min-w-[6rem] min-h-[2rem] rounded-2xl shadow-[0_0_15px_5px_rgba(0,0,0,0.22)]',
};
const autoSizeStyle = `${sizeStyles.sm} ${applyBreakpoint(sizeStyles.md, 'md')} ${applyBreakpoint(sizeStyles.lg, 'lg')}`;

// Text styles
const textStyles: Record<string, string> = {
  sm: 'text-[11px]',
  md: 'text-sm',
  lg: 'text-base',
  auto: 'text-[9px] md:text-sm lg:text-base',
};
const autoTextStyle = `${textStyles.sm} ${applyBreakpoint(textStyles.md, 'md')} ${applyBreakpoint(textStyles.lg, 'lg')}`;

export default function Button({
  children,
  variant = 'primary',
  size = 'auto',
  className = '',
  disabled = false,
  onClick = async () => {},
  ...props
}: ButtonProps) {
  // Apply styles
  const variantClass = disabled ? disabledStyle : variantStyles[variant];
  const sizeClass = size === 'auto' ? autoSizeStyle : sizeStyles[size];
  const textClass = size === 'auto' ? autoTextStyle : textStyles[size];

  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <MuiButton
      className={clsx(baseButtonStyle, variantClass, sizeClass, className)}
      disabled={disabled || loading}
      onClick={handleClick}
      sx={{ minWidth: 0, padding: 0, borderRadius: 0 }}
      {...props}
    >
      <span
        className={clsx(baseTextStyle, textClass)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress
            size={'1.5em'}
            color="inherit"
            thickness={6}
            style={{ position: 'absolute' }}
          />
        ) : null}
        <span style={{ opacity: loading ? 0 : 1 }}>{children}</span>
      </span>
    </MuiButton>
  );
}
