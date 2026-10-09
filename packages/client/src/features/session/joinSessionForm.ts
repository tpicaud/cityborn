'use client';

import { SessionIdSchema } from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

const JoinSessionSchema = z.object({
  code: z.string().min(1, 'Veuillez entrer un code').pipe(SessionIdSchema),
});

type JoinSessionFormInput = z.input<typeof JoinSessionSchema>;
export type JoinSessionFormValues = z.output<typeof JoinSessionSchema>;

export type JoinSessionForm = UseFormReturn<
  JoinSessionFormInput,
  undefined,
  JoinSessionFormValues
>;

export function useJoinSessionForm(): JoinSessionForm {
  return useForm<JoinSessionFormInput, undefined, JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: { code: '' },
  });
}
