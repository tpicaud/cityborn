import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export default function CenteredPageCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Box className="flex flex-col items-center gap-4 bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm w-full text-center">
        {children}
      </Box>
    </main>
  );
}
