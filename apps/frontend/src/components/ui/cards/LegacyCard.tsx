import type { ReactNode } from 'react';

type LegacyCardProps = {
  children: ReactNode;
};

export function LegacyCard({ children }: LegacyCardProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center pb-4">
      <div className="flex max-h-full max-w-full flex-col overflow-auto rounded-2xl bg-slate-100 p-6 text-(--foreground) shadow-xl">
        {children}
      </div>
    </div>
  );
}
