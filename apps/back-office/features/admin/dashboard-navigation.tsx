'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type DashboardLink = { href: string; label: string };

const dashboardLinks: DashboardLink[] = [
  { href: '/dashboard', label: 'Packs' },
  { href: '/dashboard/themes', label: 'Thèmes' },
  { href: '/dashboard/sections', label: 'Sections' },
];

export function DashboardNavigation() {
  const pathname: string = usePathname();
  const currentLink: DashboardLink | undefined = dashboardLinks.findLast(
    ({ href }) => pathname.startsWith(href),
  );
  return (
    <nav aria-label="Administration" className="flex items-center gap-4">
      {dashboardLinks.map((link) => {
        const isCurrent: boolean = link === currentLink;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={
              isCurrent
                ? 'font-bold text-white underline underline-offset-8'
                : 'text-zinc-400 hover:text-white'
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
