import { ErrorDialog } from "@/components/ui/dialogs/ErrorDialog";
import { ApiError, getFriendlyErrorMessage } from "@cityborn/errors";
import { createContext, ReactNode, useState } from "react";

type ui_type = 'dialog';

type ErrorContextType = {
    invokeError: (error: ApiError | string) => void;
}

const ErrorContext = createContext<ErrorContextType>({
    invokeError: () => { }
});

const ErrorProvider = ({ children }: { children: ReactNode }) => {
    const [errorMessage, setErrorMessage] = useState<string>('');

    const invokeError = (error: ApiError | string, ui_type: ui_type = 'dialog') => {
        if (error instanceof ApiError) {
            const message = getFriendlyErrorMessage(error);
            setErrorMessage(message);
        } else {
            setErrorMessage(error);
        }
    }

    return (
        <ErrorContext.Provider value={{invokeError}}>
            {children}
            <ErrorDialog errorMessage={errorMessage} setErrorMessage={setErrorMessage}/>
        </ErrorContext.Provider>
    )
}