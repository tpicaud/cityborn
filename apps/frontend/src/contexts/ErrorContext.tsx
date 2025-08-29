'use client';

import { ErrorDialog } from "@/components/ui/dialogs/ErrorDialog";
import { ApiError, ErrorCode, getFriendlyErrorMessage } from "@cityborn/errors";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type ui_type = 'dialog';

type ErrorContextType = {
    invokeError: (error: ApiError | string) => void;
}

const ErrorContext = createContext<ErrorContextType>({
    invokeError: () => { }
});

const ErrorProvider = ({ children }: { children: ReactNode }) => {
    const [errorMessage, setErrorMessage] = useState<string>('');

    const invokeError = (error: ApiError | string | any, ui_type: ui_type = 'dialog') => {
        if (error instanceof ApiError) {
            const message = getFriendlyErrorMessage(error);
            setErrorMessage(message);
        } else {
            setErrorMessage(error);
        }
    }

    return (
        <ErrorContext.Provider value={{ invokeError }}>
            {children}
            <ErrorDialog errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
        </ErrorContext.Provider>
    )
}

export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error("useError must be used within an ErrorProvider");
    }
    return context;
};

export default ErrorProvider;