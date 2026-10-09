'use client';

import { resolveErrorMessage } from '@cityborn/api';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useQueryErrorReporting } from './queryErrorReporting';

type ErrorContextType = {
  invokeError: (error: unknown, fallbackMessage?: string) => void;
};

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

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

  useQueryErrorReporting(invokeError);

  return (
    <ErrorContext.Provider value={{ invokeError }}>
      {children}
      {ErrorDialogComponent && (
        <ErrorDialogComponent
          errorMessage={errorMessage}
          open={openDialog}
          setOpen={setOpenDialog}
          onExited={() => setErrorMessage('')}
        />
      )}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context: ErrorContextType | undefined = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorProvider;
