import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';

export default function ContactEmail() {
  return (
    <a
      className="break-words underline"
      href={`mailto:${CITYBORN_CONTACT_EMAIL}`}
    >
      {CITYBORN_CONTACT_EMAIL}
    </a>
  );
}
