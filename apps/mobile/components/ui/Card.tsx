import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { View } from 'react-native';

type CardProps = {
  children: ReactNode;
  variant?: 'fill' | 'outline';
  color?: 'primary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

export default function Card({
  children,
  variant = 'fill',
  color = 'primary',
  size = 'medium',
  className = '',
}: CardProps) {
  // Variant-level styles (border, background type, etc.)
  const variantStyles = {
    fill: '',
    outline: 'border-2 bg-transparent',
  };

  // Color styles depending on variant
  const containerStyles = {
    primary: {
      fill: 'bg-primary-500',
      outline: 'border-primary-500 bg-zinc-200',
    },
    destructive: {
      fill: 'bg-destructive-500',
      outline: 'border-destructive-500',
    },
  };

  // Padding / size styles
  const sizeStyles = {
    small: 'p-2 rounded-lg',
    medium: 'p-4 rounded-xl',
    large: 'p-6 rounded-2xl',
  };

  return (
    <View
      className={cn(
        'rounded-xl',
        variantStyles[variant],
        containerStyles[color][variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </View>
  );
}
