import type { BaseSyntheticEvent } from 'react';

export type FormSubmitHandler = (event?: BaseSyntheticEvent) => Promise<void>;
