import {
  Text as NativeText,
  type TextProps as NativeTextProps,
  View as NativeView,
  type ViewProps as NativeViewProps,
} from 'react-native';
import { cn } from '@/lib/utils';

export function Text({ children, className = '', ...props }: NativeTextProps) {
  return (
    <NativeText className={cn('text-foreground', className)} {...props}>
      {children}
    </NativeText>
  );
}

export function View({ children, className = '', ...props }: NativeViewProps) {
  return (
    <NativeView className={cn(className)} {...props}>
      {children}
    </NativeView>
  );
}
