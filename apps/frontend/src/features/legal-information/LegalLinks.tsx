import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import Link from 'next/link';

export function LegalLinks() {
  return (
    <footer className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
      <a
        href={`mailto:${CITYBORN_CONTACT_EMAIL}`}
        className="text-sm text-gray-600 hover:underline"
      >
        Nous contacter
      </a>
      <Link
        href="/terms-and-policies"
        className="text-sm text-gray-600 hover:underline text-center"
      >
        Politiques et conditions
      </Link>
    </footer>
  );
}
