import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { FooterLink, FooterLinks } from '@cityborn/design-system';

type LegalLinksProps = { onDarkBackground?: boolean };

export function LegalLinks({ onDarkBackground = false }: LegalLinksProps) {
  return (
    <FooterLinks disableOptimization>
      <FooterLink
        href={`mailto:${CITYBORN_CONTACT_EMAIL}`}
        onDarkBackground={onDarkBackground}
      >
        Nous contacter
      </FooterLink>
      <FooterLink
        href="/terms-and-policies"
        onDarkBackground={onDarkBackground}
      >
        Politiques et conditions
      </FooterLink>
    </FooterLinks>
  );
}
