import type { Metadata } from 'next';
import LegalInformation from '@/features/legal-information/legal-information';

export const metadata: Metadata = {
  title: 'Politiques et conditions | Cityborn',
  description:
    'Politique de confidentialité et conditions générales d’utilisation de Cityborn Games.',
};

export default function TermsAndPoliciesPage() {
  return <LegalInformation />;
}
