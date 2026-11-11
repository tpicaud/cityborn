import { type SignOut, useSignOut } from '@cityborn/client/auth';
import Button from '@/components/ui/Button';
import { signOutFromGoogle } from './SignInWithGoogleButton';

type SignOutButtonProps = {
  onSignedOut: () => void;
};

export function SignOutButton({ onSignedOut }: SignOutButtonProps) {
  const { signOut }: SignOut = useSignOut({
    onSignedOut: () => {
      void signOutFromGoogle();
      onSignedOut();
    },
  });

  return (
    <Button
      variant="default"
      label="Déconnexion"
      className="self-center"
      onPress={signOut}
    />
  );
}
