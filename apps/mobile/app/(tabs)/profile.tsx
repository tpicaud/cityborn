import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import { SignInOrSignUp } from '@/features/auth/SignInOrSignUp';
import { Profile } from '@/features/profile/Profile';

export default function ProfileScreen() {
  const { user }: CurrentUser = useCurrentUser();

  if (!user) return <SignInOrSignUp />;

  return <Profile user={user} />;
}
