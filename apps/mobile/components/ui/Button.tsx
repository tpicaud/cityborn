import { cn } from '@/lib/utils';
import { StyleSheet, View, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  variant?: 'default' | 'primary' | 'destructive' | 'outlined' | 'ghost';
  size?: 'default';
  className?: string;
  onPress?: () => void;
};

export default function Button({
  label,
  variant = 'primary',
  size = 'default',
  className,
  onPress,
}: Props) {
  return (
    <View
      className={cn(
        /* base -------------------------------------------------------------- */
        'inline-flex items-center justify-center whitespace-nowrap cursor-pointer rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50',
        /* variants ---------------------------------------------------------- */
        variant === 'default' &&
          'bg-zinc-800 text-zinc-50 shadow hover:bg-zinc-700',
        variant === 'primary' &&
          'bg-primary-600 text-zinc-50 shadow hover:bg-primary/90',
        variant === 'destructive' &&
          'bg-red-700 text-zinc-50 shadow hover:bg-red-700',
        variant === 'outlined' &&
          'border border-zinc-700 bg-transparent text-zinc-50 hover:bg-zinc-800 hover:text-zinc-100',
        variant === 'ghost' && 'hover:bg-zinc-800 hover:text-zinc-50',
        /* sizes ------------------------------------------------------------- */
        size === 'default' && 'h-10 w-40 px-4 py-1',
        /* custom ------------------------------------------------------------ */
        className,
      )}
    >
      <Pressable onPress={onPress}>
        <Text
          className={cn(
            /* variants ---------------------------------------------------------- */
            variant === 'default' && 'text-zinc-50',
            variant === 'primary' && 'text-zinc-50',
            variant === 'destructive' && 'text-zinc-50',
            variant === 'outlined' && 'text-zinc-50',
            variant === 'ghost' && 'text-zinc-50',
          )}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
