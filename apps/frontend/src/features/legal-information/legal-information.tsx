import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import Link from 'next/link';
import PrivacyPolicy from './privacy-policy';
import TermsOfUse from './terms-of-use';

export default function LegalInformation() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-10 rounded-xl bg-white p-4 shadow-sm sm:p-8">
        <header className="space-y-4">
          <Link href="/" className="text-sm text-gray-600 underline">
            Retour à Cityborn
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Politiques et conditions
          </h1>
          <nav aria-label="Documents légaux" className="flex flex-wrap gap-4">
            <a href="#privacy-policy" className="text-gray-700 underline">
              Politique de confidentialité
            </a>
            <a href="#terms-of-use" className="text-gray-700 underline">
              Conditions générales d’utilisation
            </a>
          </nav>
        </header>
        <PrivacyPolicy />
        <hr className="border-gray-200" />
        <TermsOfUse />
        <footer className="border-t border-gray-200 pt-6">
          <a
            href={`mailto:${CITYBORN_CONTACT_EMAIL}`}
            className="text-gray-700 underline"
          >
            Nous contacter : {CITYBORN_CONTACT_EMAIL}
          </a>
        </footer>
      </div>
    </div>
  );
}
