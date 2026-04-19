import {
  TextInput as NativeTextInput,
  type TextInputProps,
} from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  className?: string;
  error?: boolean;
}

export default function TextInput({
  className = '',
  error = false,
  ...props
}: InputProps) {
  return (
    <NativeTextInput
      {...props}
      className={cn(
        'w-70 h-14 bg-background text-foreground pl-3 rounded-full border-1',
        error && 'border-destructive-500',
        className,
      )}
    />
  );
}
