import { BrandScreen } from '@cityborn/design-system';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

type AuthScreenProps = {
  title: string;
  children: ReactNode;
  bottomSafeArea?: boolean;
  onBack?: () => void;
};

export function AuthScreen({
  title,
  children,
  bottomSafeArea = false,
  onBack,
}: AuthScreenProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BrandScreen
        title={title}
        form
        bottomSafeArea={bottomSafeArea}
        onBack={onBack}
      >
        {children}
      </BrandScreen>
    </KeyboardAvoidingView>
  );
}
