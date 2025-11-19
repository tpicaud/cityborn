import { View as NativeView, ViewProps as NativeViewProps } from 'react-native';

export default function View({
  children,
  className = '',
  ...props
}: NativeViewProps) {
  return (
    <NativeView className={`bg-background ${className}`} {...props}>
      {children}
    </NativeView>
  );
}
