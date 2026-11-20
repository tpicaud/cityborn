import type { User } from '@cityborn/api';
import {
  type AccountDeletion,
  useAccountDeletion,
} from '@cityborn/client/profile';
import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import {
  BodyText,
  Button,
  Footnote,
  FootnoteLink,
  Footnotes,
  IdentityCard,
  Popup,
  Screen,
  TextButton,
} from '@cityborn/design-system';
import Constants from 'expo-constants';
import { type ImperativeRouter, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import { View } from 'tamagui';
import { EmailVerificationNotice } from '@/features/auth/EmailVerificationNotice';
import { LegalDocumentLinks } from '@/features/legal-information/LegalDocumentLinks';
import {
  type ExternalLinkOpener,
  useExternalLinkOpener,
} from '@/lib/externalLink';
import { EditProfile } from './EditProfile';
import { GameHistory } from './GameHistory';

const appVersion: string | undefined = Constants.expoConfig?.version;

type ProfileProps = {
  user: User;
};

export function Profile({ user }: ProfileProps) {
  const router: ImperativeRouter = useRouter();
  const openExternalLink: ExternalLinkOpener = useExternalLinkOpener();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const {
    isConfirmationOpen,
    openConfirmation,
    closeConfirmation,
    deleteAccount,
  }: AccountDeletion = useAccountDeletion({
    onAccountDeleted: () => router.navigate('/'),
  });

  useFocusEffect(
    useCallback(() => {
      if (!isEditing) return undefined;
      const subscription: NativeEventSubscription =
        BackHandler.addEventListener('hardwareBackPress', () => {
          setIsEditing(false);
          return true;
        });
      return () => subscription.remove();
    }, [isEditing]),
  );

  if (isEditing) {
    return <EditProfile user={user} onBack={() => setIsEditing(false)} />;
  }

  return (
    <Screen title="Profil" scrollable>
      <View gap="3 md:5">
        {user.isVerified === false && <EmailVerificationNotice />}
        <IdentityCard
          title={user.username}
          subtitle={user.email}
          actionLabel="Modifier le profil"
          onAction={() => setIsEditing(true)}
        />
        <GameHistory />
        <View gap="1 md:2" mt="1 md:3">
          <LegalDocumentLinks />
        </View>
        <Footnotes mt="1 md:4">
          <FootnoteLink
            onPress={() =>
              void openExternalLink(`mailto:${CITYBORN_CONTACT_EMAIL}`)
            }
          >
            {CITYBORN_CONTACT_EMAIL}
          </FootnoteLink>
          {appVersion !== undefined && <Footnote>v{appVersion}</Footnote>}
        </Footnotes>
        <View mt="14 md:28">
          <TextButton
            tone="danger"
            label="Supprimer mon compte"
            onPress={openConfirmation}
          />
        </View>
      </View>
      <Popup
        open={isConfirmationOpen}
        onClose={closeConfirmation}
        title="Supprimer ton compte ?"
      >
        <View gap="4">
          <BodyText>Ton historique disparaîtra définitivement.</BodyText>
          <Button compact label="Supprimer" onPress={deleteAccount} />
          <TextButton label="Annuler" onPress={closeConfirmation} />
        </View>
      </Popup>
    </Screen>
  );
}
