import {
  type ApiError,
  getFriendlyErrorMessage,
  isApiError,
} from '@cityborn/api';
import { createContext, type ReactNode, useContext, useState } from 'react';

type ui_type = 'dialog';

type ErrorContextType = {
  invokeError: (error: ApiError | string) => void;
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

  const invokeError = (
    error: ApiError | string,
    ui_type: ui_type = 'dialog',
  ) => {
    if (isApiError(error)) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } else {
      setErrorMessage(error);
    }

    console.error(error);
    if (ui_type === 'dialog') {
      setOpenDialog(true);
    }
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
