import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/buttons/NewButton';

export default function Header() {
  return (
    <header
      className="h-20 md:h-24
                        flex flex-row items-center justify-between
                        bg-transparent p-1 z-10"
    >
      <div className="flex items-center h-full">
        <Link
          href="/"
          className="h-full transition-transform duration-200 ease-in-out transform hover:scale-105 active:scale-95"
        >
          <Image
            src="/logo.svg"
            alt="Logo"
            width={131}
            height={133}
            className="h-full w-auto"
          />
        </Link>
      </div>

      <div className="flex flex-row items-center justify-between gap-2 md:gap-3 h-full">
        <Button variant="secondary">CONNEXION</Button>
        <Button variant="primary">INSCRIPTION</Button>
      </div>
    </header>
  );
}
