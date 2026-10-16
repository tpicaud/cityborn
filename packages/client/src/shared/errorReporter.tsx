'use client';

import {
  type ApiError,
  ApiResponseError,
  ErrorCode,
  isApiError,
  resolveErrorMessage,
} from '@cityborn/api';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

function toApiError(error: unknown): ApiError | null {
  if (error instanceof ApiResponseError) return error.apiError;
  if (isApiError(error)) return error;
  return null;
}

export function isExpectedApiError(error: unknown): boolean {
  const apiError: ApiError | null = toApiError(error);
  if (!apiError) return false;
  if (apiError.code === ErrorCode.BAD_REQUEST) return false;
  return apiError.statusCode >= 400 && apiError.statusCode < 500;
}

export type ReportError = (error: unknown, fallbackMessage?: string) => void;

export type ErrorReporter = {
  reportError: ReportError;
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

type ErrorReporterProviderProps = {
  children: ReactNode;
  ErrorDialogComponent: React.ComponentType<ErrorDialogProps>;
};

export const ErrorReporterProvider = ({
  children,
  ErrorDialogComponent,
}: ErrorReporterProviderProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const reportError: ReportError = useCallback(
    (error: unknown, fallbackMessage?: string): void => {
      setErrorMessage(resolveErrorMessage(error, fallbackMessage));
      if (!isExpectedApiError(error)) console.error(error);
      setOpenDialog(true);
    },
    [],
  );

  return (
    <ErrorReporterContext.Provider value={{ reportError }}>
      {children}
      <ErrorDialogComponent
        errorMessage={errorMessage}
        open={openDialog}
        setOpen={setOpenDialog}
        onExited={() => setErrorMessage('')}
      />
    </ErrorReporterContext.Provider>
  );
};

export const useErrorReporter = (): ErrorReporter => {
  const errorReporter: ErrorReporter | undefined =
    useContext(ErrorReporterContext);
  if (!errorReporter) {
    throw new Error(
      'useErrorReporter must be used within an ErrorReporterProvider',
    );
  }
  return errorReporter;
};
