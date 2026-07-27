'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function SwaggerButton() {
  return (
    <Link href="/swagger">
      <Button variant="ghost" size="sm">
        <BookOpen className="h-4 w-4" />
      </Button>
    </Link>
  );
}
