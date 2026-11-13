'use client';

import { ListRow } from '@cityborn/design-system';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';

export function LegalDocumentLinks() {
  const router: AppRouterInstance = useRouter();

  return (
    <>
      <ListRow
        label="Politique de confidentialité"
        onPress={() => router.push('/terms-and-policies#privacy-policy')}
      />
      <ListRow
        label="Conditions d’utilisation"
        onPress={() => router.push('/terms-and-policies#terms-of-use')}
      />
    </>
  );
}
