'use client';

import { ApiError, getFriendlyErrorMessage } from '@cityborn/errors';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { ErrorDialog } from '@/components/ui/dialogs/ErrorDialog';

type ui_type = 'dialog';

type ErrorContextType = {
  invokeError: (error: ApiError | string) => void;
};

const ErrorContext = createContext<ErrorContextType>({
  invokeError: () => {},
});

const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);

  const invokeError = (
    error: ApiError | string | any,
    ui_type: ui_type = 'dialog',
  ) => {
    if (error instanceof ApiError) {
      const message = getFriendlyErrorMessage(error);
      setErrorMessage(message);
    } else if (typeof error === 'string') {
      setErrorMessage(error);
    } else {
      const errorMessage = error.message ?? 'Unexpected error';
      setErrorMessage(errorMessage);
    }

    console.log(error);
    if (ui_type === 'dialog') {
      setOpenDialog(true);
    }
  };

  return (
    <ErrorContext.Provider value={{ invokeError }}>
      {children}
      <ErrorDialog
        errorMessage={errorMessage}
        open={openDialog}
        setOpen={setOpenDialog}
        onExited={() => setErrorMessage('')}
      />
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
