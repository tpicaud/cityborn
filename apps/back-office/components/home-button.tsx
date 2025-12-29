'use client';

import { House } from 'lucide-react';
import { Button } from './ui/Button';
import Link from 'next/link';

export default function HomeButton() {
  return (
    <Link href="/dashboard">
      <Button variant="outline">
        <House className="h-4 w-4" />
      </Button>
    </Link>
  );
}
