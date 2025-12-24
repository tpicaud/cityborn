import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';
import { Pressable, Text } from 'react-native';
import LoaderIcon from './LoaderIcon';

type Props = {
  children?: ReactNode;
  label?: string;
  color?: 'primary' | 'destructive';
  variant?: 'default' | 'filled' | 'outlined' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  onPress?: () => Promise<void> | void;
};

export default function Button({
  children,
  label,
  color = 'primary',
  variant = 'filled',
  size = 'small',
  disabled = false,
  className,
  onPress,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (!onPress) return;

    try {
      setIsLoading(true);
      await onPress();
    } finally {
      setIsLoading(false);
    }
  };

  // Default button
  if (variant === 'default') {
    return (
      <Pressable onPress={handlePress} className={className}>
        <Text className="font-medium text-zinc-900 underline">{label}</Text>
      </Pressable>
    );
  }

  // Styled button
  const variantStyles = {
    filled: 'border-2 border-transparent',
    outlined: 'border-2',
    ghost: 'border-2 border-transparent',
  };

  const containerStyles = {
    primary: {
      filled: 'bg-primary-200 hover:bg-primary-400',
      outlined: 'bg-transparent border-primary-500 hover:bg-primary-500/10',
      ghost: 'bg-transparent hover:bg-primary-500/10',
    },
    destructive: {
      filled: 'bg-destructive-500 hover:bg-destructive-400',
      outlined:
        'bg-transparent border-destructive-500 hover:bg-destructive-500/10',
      ghost: 'bg-transparent hover:bg-destructive-500/10',
    },
  };

  const textStyles = {
    primary: {
      filled: 'text-zinc-50',
      outlined: 'text-primary-500',
      ghost: 'text-primary-400',
    },
    destructive: {
      filled: 'text-zinc-50',
      outlined: 'text-destructive-500',
      ghost: 'text-destructive-500',
    },
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      key={Math.random()}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-colors',
        size === 'small' && 'h-10 w-48 px-4 py-1',
        size === 'medium' && 'h-12 w-60 px-4 py-1',
        size === 'large' && 'h-14 w-70 px-4 font-bold',
        variantStyles[variant],
        containerStyles[color][variant],
        disabled ? 'opacity-50' : 'opacity-100',
        className,
      )}
    >
      {isLoading ? (
        <LoaderIcon color="white" />
      ) : label ? (
        <Text className={cn('font-medium', textStyles[color][variant])}>
          {label}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
