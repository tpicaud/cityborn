'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export function DashboardNavigation() {
  const pathname: string = usePathname();
  const isThemes: boolean = pathname.startsWith('/dashboard/themes');
  return (
    <nav aria-label="Administration" className="flex items-center gap-4">
      <Link
        href="/dashboard"
        aria-current={!isThemes ? 'page' : undefined}
        className={
          !isThemes
            ? 'font-bold text-white underline underline-offset-8'
            : 'text-zinc-400 hover:text-white'
        }
      >
        Packs
      </Link>
      <Link
        href="/dashboard/themes"
        aria-current={isThemes ? 'page' : undefined}
        className={
          isThemes
            ? 'font-bold text-white underline underline-offset-8'
            : 'text-zinc-400 hover:text-white'
        }
      >
        Thèmes
      </Link>
    </nav>
  );
}
