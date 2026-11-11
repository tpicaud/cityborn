import { BrandScreen } from '@cityborn/design-system';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

type AuthScreenProps = {
  title: string;
  children: ReactNode;
  bottomSafeArea?: boolean;
};

export function AuthScreen({
  title,
  children,
  bottomSafeArea = false,
}: AuthScreenProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BrandScreen
        title={title}
        adaptiveDensity
        bottomSafeArea={bottomSafeArea}
      >
        {children}
      </BrandScreen>
    </KeyboardAvoidingView>
  );
}
