import { cn } from '@/lib/utils';
import {
  Text as NativeText,
  TextProps as NativeTextProps,
  View as NativeView,
  ViewProps as NativeViewProps,
} from 'react-native';

export function Text({ children, className = '', ...props }: NativeTextProps) {
  return (
    <NativeText className={cn('text-foreground', className)} {...props}>
      {children}
    </NativeText>
  );
}

export function View({ children, className = '', ...props }: NativeViewProps) {
  return (
    <NativeView className={cn(`bg-transparent`, className)} {...props}>
      {children}
    </NativeView>
  );
}
