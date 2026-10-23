'use client';

import {
  type CurrentUser,
  type SignOut,
  useCurrentUser,
  useSignOut,
} from '@cityborn/client/auth';
import LogoutIcon from '@mui/icons-material/Logout';
import LoadingIconButton from '@/components/ui/buttons/LoadingIconButton';

export default function SignOutButton({
  onSignedOut,
}: {
  onSignedOut: () => void;
}) {
  const { user }: CurrentUser = useCurrentUser();
  const { signOut }: SignOut = useSignOut({ onSignedOut });

  return (
    <LoadingIconButton
      onClick={signOut}
      sx={{
        visibility: user ? 'visible' : 'hidden',
      }}
      className="z-10"
    >
      <LogoutIcon />
    </LoadingIconButton>
  );
}
