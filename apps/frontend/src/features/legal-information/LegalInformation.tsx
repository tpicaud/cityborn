'use client';

import { Panel, Screen } from '@cityborn/design-system';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { View } from 'tamagui';
import ContactEmail from './ContactEmail';
import { LegalParagraph } from './LegalText';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfUse from './TermsOfUse';

export default function LegalInformation() {
  const router: AppRouterInstance = useRouter();

  return (
    <Screen onBack={() => router.push('/profile')} bottomSafeArea scrollable>
      <View gap="3 md:5">
        <Panel p="4 md:8">
          <PrivacyPolicy />
        </Panel>
        <Panel p="4 md:8">
          <TermsOfUse />
        </Panel>
        <LegalParagraph>
          Nous contacter : <ContactEmail />
        </LegalParagraph>
      </View>
    </Screen>
  );
}
