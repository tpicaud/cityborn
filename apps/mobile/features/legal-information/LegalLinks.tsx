import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { FooterLink, FooterLinks } from '@cityborn/design-system';
import {
  type ExternalLinkOpener,
  useExternalLinkOpener,
} from '@/lib/externalLink';
import { termsAndPoliciesUrl } from './LegalDocumentLinks';

type LegalLinksProps = { onDarkBackground?: boolean };

export function LegalLinks({ onDarkBackground = false }: LegalLinksProps) {
  const openExternalLink: ExternalLinkOpener = useExternalLinkOpener();

  return (
    <FooterLinks>
      <FooterLink
        onPress={() =>
          void openExternalLink(`mailto:${CITYBORN_CONTACT_EMAIL}`)
        }
        onDarkBackground={onDarkBackground}
      >
        Nous contacter
      </FooterLink>
      <FooterLink
        onPress={() => void openExternalLink(termsAndPoliciesUrl)}
        onDarkBackground={onDarkBackground}
      >
        Politiques et conditions
      </FooterLink>
    </FooterLinks>
  );
}
