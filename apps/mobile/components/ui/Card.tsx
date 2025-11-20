import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { View } from 'react-native';

type CardProps = {
  children: ReactNode;
  color?: 'primary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

export default function Card({
  children,
  color = 'primary',
  size = 'medium',
  className = '',
}: CardProps) {
  return (
    <View
      className={cn(
        'rounded-lg',
        color === 'primary' && 'bg-primary-500',
        color === 'destructive' && 'bg-destructive-200',
        size === 'small' && 'rounded-lg p-2',
        size === 'medium' && 'p-4 rounded-xl',
        size === 'large' && 'p-5 rounded-xl',
        className,
      )}
    >
      {children}
    </View>
  );
}
