'use client';

import type { Navigation } from '@cityborn/client/platform';
import {
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import LoadingButton from '@/components/ui/buttons/LoadingButton';
import { useNavigation } from '@/lib/navigation';

export default function SoloPlay() {
  const navigation: Navigation = useNavigation();
  const { playSolo }: SessionLauncher = useSessionLauncher({ navigation });

  return (
    <div className="flex flex-col gap-2 items-center justify-center w-full">
      <LoadingButton
        variant="contained"
        color="primary"
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-full"
        onClick={playSolo}
      >
        <b>SOLO</b>
      </LoadingButton>
    </div>
  );
}
