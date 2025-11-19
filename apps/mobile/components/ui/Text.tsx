import { cn } from '@/lib/utils';
import { Text as NativeText, TextProps as NativeTextProps } from 'react-native';

export default function Text({
  children,
  className = '',
  ...props
}: NativeTextProps) {
  return (
    <NativeText className={cn('text-foreground', className)} {...props}>
      {children}
    </NativeText>
  );
}
