import { z } from 'zod';

export const JoinSessionSchema = z.object({
  code: z.string().min(1, 'Veuillez entrer un code'),
});

export type JoinSessionFormValues = z.infer<typeof JoinSessionSchema>;

export const JOIN_SESSION_FORM_DEFAULT_VALUES: JoinSessionFormValues = {
  code: '',
};
