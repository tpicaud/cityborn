'use client';

import HomeHero from './HomeHero';

export default function Page() {
  return (
    <main>
      <HomeHero
        onPlay={() => console.log('Jouer')}
        onSignIn={() => console.log('Se connecter')}
        onSignUp={() => console.log('S’inscrire')}
      />
    </main>
  );
}
