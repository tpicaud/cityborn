import { ListRow } from '@cityborn/design-system';
import {
  type ExternalLinkOpener,
  useExternalLinkOpener,
} from '@/lib/externalLink';

export const termsAndPoliciesUrl: string =
  'https://www.cityborn.app/terms-and-policies';

export function LegalDocumentLinks() {
  const openExternalLink: ExternalLinkOpener = useExternalLinkOpener();

  return (
    <>
      <ListRow
        label="Politique de confidentialité"
        onPress={() =>
          void openExternalLink(`${termsAndPoliciesUrl}#privacy-policy`)
        }
      />
      <ListRow
        label="Conditions d’utilisation"
        onPress={() =>
          void openExternalLink(`${termsAndPoliciesUrl}#terms-of-use`)
        }
      />
    </>
  );
}
