'use client';

import { resolveErrorMessage } from '@cityborn/api';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

export type ErrorReporter = {
  invokeError: (error: unknown, fallbackMessage?: string) => void;
};

const ErrorReporterContext = createContext<ErrorReporter | undefined>(
  undefined,
);

export type ErrorDialogProps = {
  errorMessage: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onExited?: () => void;
};

type ErrorProviderProps = {
  children: ReactNode;
  ErrorDialogComponent?: React.ComponentType<ErrorDialogProps>;
};

export const ErrorProvider = ({
  children,
  ErrorDialogComponent,
}: ErrorProviderProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const invokeError = useCallback(
    (error: unknown, fallbackMessage?: string): void => {
      setErrorMessage(resolveErrorMessage(error, fallbackMessage));
      console.error(error);
      setOpenDialog(true);
    },
    [],
  );

  return (
    <ErrorReporterContext.Provider value={{ invokeError }}>
      {children}
      {ErrorDialogComponent && (
        <ErrorDialogComponent
          errorMessage={errorMessage}
          open={openDialog}
          setOpen={setOpenDialog}
          onExited={() => setErrorMessage('')}
        />
      )}
    </ErrorReporterContext.Provider>
  );
};

export const useErrorReporter = (): ErrorReporter => {
  const errorReporter: ErrorReporter | undefined =
    useContext(ErrorReporterContext);
  if (!errorReporter) {
    throw new Error('useErrorReporter must be used within an ErrorProvider');
  }
  return errorReporter;
};
