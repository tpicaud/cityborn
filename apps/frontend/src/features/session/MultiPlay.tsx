'use client';

import type { Navigation } from '@cityborn/client/platform';
import {
  formatSessionCodeInput,
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import { Controller } from 'react-hook-form';
import LoadingButton from '@/components/ui/buttons/LoadingButton';
import { useNavigation } from '@/lib/navigation';

export default function MultiPlay() {
  const navigation: Navigation = useNavigation();
  const {
    joinSessionForm: {
      control,
      formState: { errors },
    },
    playMulti,
    joinSession,
  }: SessionLauncher = useSessionLauncher({ navigation });

  return (
    <div className="flex flex-col gap-2 items-center justify-center w-full">
      <form onSubmit={joinSession} className="flex flex-col gap-1 w-full">
        <div className="flex flex-row gap-2 items-center justify-center w-full">
          <Controller
            control={control}
            name="code"
            render={({ field: { name, onChange, onBlur, ref, value } }) => (
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Code"
                className="border border-gray-300 rounded px-4 py-2 w-full"
                name={name}
                ref={ref}
                value={value}
                onChange={(event) =>
                  onChange(formatSessionCodeInput(event.target.value))
                }
                onBlur={onBlur}
              />
            )}
          />
          <LoadingButton
            type="button"
            variant="contained"
            color="primary"
            className="text-white px-6 py-2 rounded"
            onClick={joinSession}
          >
            <p className="px-3">Rejoindre</p>
          </LoadingButton>
        </div>
        {errors.code && (
          <p className="text-red-500 text-sm text-center">
            {errors.code.message}
          </p>
        )}
      </form>
      <LoadingButton
        variant="contained"
        color="primary"
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-full"
        onClick={playMulti}
      >
        <b>MULTI</b>
      </LoadingButton>
    </div>
  );
}
