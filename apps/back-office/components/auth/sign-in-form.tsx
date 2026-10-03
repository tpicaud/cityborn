'use client';

import { type SignInFlow, useSignIn } from '@cityborn/client/auth';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '../ui/Button';

const inputClassName: string =
  'w-full px-3 py-2 bg-zinc-700/90 backdrop-blur-sm border border-zinc-600 rounded-md text-zinc-50 focus:outline-none focus:ring-1 focus:ring-primary';

export function SignInForm() {
  const router = useRouter();
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    submit,
  }: SignInFlow = useSignIn({
    authApi,
    onSignedIn: () => router.replace('/dashboard'),
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="identifier"
          className="block text-sm font-medium text-zinc-300 mb-2"
        >
          Email ou nom d'utilisateur
        </label>
        <input
          id="identifier"
          autoComplete="username"
          className={inputClassName}
          {...register('identifier')}
        />
        {errors.identifier && (
          <p className="text-red-400 text-sm mt-1">
            {errors.identifier.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-300 mb-2"
        >
          Mot de passe
        </label>
        <input
          type="password"
          id="password"
          autoComplete="current-password"
          className={inputClassName}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isSubmitting}
        disableLoading
      >
        {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
      </Button>
    </form>
  );
}
