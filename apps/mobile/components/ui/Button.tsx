import { type ReactNode, type RefObject, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { cn } from '@/lib/classNames';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const pressInFlightRef: RefObject<boolean> = useRef<boolean>(false);

  const handlePress = async (): Promise<void> => {
    if (!onPress || disabled || pressInFlightRef.current) return;

    pressInFlightRef.current = true;
    setIsLoading(true);
    try {
      await onPress();
    } finally {
      pressInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const isDisabled: boolean = disabled || isLoading;

  if (variant === 'default') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        className={className}
      >
        <Text className="font-medium text-zinc-900 underline">{label}</Text>
      </Pressable>
    );
  }

  const variantStyles = {
    filled: 'border-2 border-transparent',
    outlined: 'border-2',
    ghost: 'border-2 border-transparent',
  };

  const containerStyles = {
    primary: {
      filled: 'bg-primary-500 hover:bg-primary-400',
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
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-colors',
        size === 'small' && 'h-10 w-48 px-4 py-1',
        size === 'medium' && 'h-12 w-60 px-4 py-1',
        size === 'large' && 'h-14 w-70 px-4 font-bold',
        variantStyles[variant],
        containerStyles[color][variant],
        isDisabled ? 'opacity-50' : 'opacity-100',
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
