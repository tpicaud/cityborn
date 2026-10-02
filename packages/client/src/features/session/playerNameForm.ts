'use client';

import { PlayerIdSchema } from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

const PlayerNameFormSchema = z.object({
  playerID: z
    .string()
    .trim()
    .min(1, 'Veuillez entrer un pseudo')
    .pipe(PlayerIdSchema),
});

export type PlayerNameFormInput = z.input<typeof PlayerNameFormSchema>;
export type PlayerNameFormValues = z.output<typeof PlayerNameFormSchema>;

export type PlayerNameForm = UseFormReturn<
  PlayerNameFormInput,
  undefined,
  PlayerNameFormValues
>;

export function usePlayerNameForm(): PlayerNameForm {
  return useForm<PlayerNameFormInput, undefined, PlayerNameFormValues>({
    resolver: zodResolver(PlayerNameFormSchema),
    defaultValues: { playerID: '' },
  });
}
