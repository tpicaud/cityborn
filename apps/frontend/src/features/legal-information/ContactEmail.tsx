import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { LegalLink } from './LegalText';

export default function ContactEmail() {
  return (
    <LegalLink href={`mailto:${CITYBORN_CONTACT_EMAIL}`}>
      {CITYBORN_CONTACT_EMAIL}
    </LegalLink>
  );
}
