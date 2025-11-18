import { cn } from '@/lib/utils';
import { TextInput as NativeTextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  className?: string;
}

export default function TextInput({ className = '', ...props }: InputProps) {
  return (
    <NativeTextInput
      {...props}
      className={cn(
        'w-68 bg-background text-foreground pl-3 rounded-full border-1',
        className,
      )}
    />
  );
}
