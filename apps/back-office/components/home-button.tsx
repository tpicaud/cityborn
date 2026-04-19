'use client';

import { House } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function HomeButton() {
  return (
    <Link href="/dashboard">
      <Button variant="outline">
        <House className="h-4 w-4" />
      </Button>
    </Link>
  );
}
