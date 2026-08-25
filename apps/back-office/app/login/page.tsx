'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { login } from '@/server/use-server/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (formData: FormData) => {
    setIsLoading(true);

    const result = await login(formData);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setIsLoading(false);
      setErrorMessage(result.error || 'Identifiants invalides');
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-md p-8 mb-40 bg-zinc-800/95 backdrop-blur-sm rounded-lg border border-zinc-700 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-zinc-50">
          Cityborn Admin Dashboard
        </h1>

        <form action={handleLoginSubmit} className="space-y-4">
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
              name="password"
              required
              className="w-full px-3 py-2 bg-zinc-700/90 backdrop-blur-sm border border-zinc-600 rounded-md text-zinc-50 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Entrez le mot de passe admin"
            />
          </div>

          {errorMessage && (
            <div className="text-red-400 text-sm text-center p-3 bg-red-800/20 rounded-md border border-red-700">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}
