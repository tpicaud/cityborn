import { VerifyEmailComponent } from '@/components/auth/VerifyEmailComponent';

type VerifyEmailPageProps = {
  searchParams: Promise<{
    verification_token?: string;
    token?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const verificationToken = params.verification_token ?? params.token ?? '';

  return <VerifyEmailComponent verificationToken={verificationToken} />;
}
