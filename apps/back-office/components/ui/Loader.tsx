import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Loader({ className = '' }: { className?: string }) {
  return <LoaderCircle className={cn(className, 'animate-spin')} />;
}
