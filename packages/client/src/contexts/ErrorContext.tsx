'use client';

import { resolveErrorMessage } from '@cityborn/api';
import { createContext, type ReactNode, useContext, useState } from 'react';

type ErrorContextType = {
  invokeError: (error: unknown, fallbackMessage?: string) => void;
};

const ErrorContext = createContext<ErrorContextType>({
  invokeError: () => {},
});

interface ErrorProviderProps {
  children: ReactNode;
  ErrorDialogComponent?: React.ComponentType<{
    errorMessage: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    onExited?: () => void;
  }>;
}

export const ErrorProvider = ({
  children,
  ErrorDialogComponent,
}: ErrorProviderProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);

  const invokeError = (error: unknown, fallbackMessage?: string) => {
    setErrorMessage(resolveErrorMessage(error, fallbackMessage));
    console.error(error);
    setOpenDialog(true);
  };

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

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorProvider;
