import { cn } from '@/lib/utils';
import {
  TextInput as NativeTextInput,
  Text,
  TextInputProps,
  View,
} from 'react-native';

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
        'w-68 bg-background text-foreground pl-3 rounded-full border-1',
        error && 'border-destructive-500',
        className,
      )}
    />
  );
}
