import { DialogContent, DialogTitle, Typography } from "@mui/material"
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Dialog } from "./Dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface ErrorDialogProps {
    errorMessage: string;
    setErrorMessage: Dispatch<SetStateAction<string>>;
};

export function ErrorDialog({ errorMessage, setErrorMessage }: ErrorDialogProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (errorMessage !== '') {
            setOpen(true);
        }
    }, [errorMessage])

    const handleClose = () => {
        setOpen(false);
        setErrorMessage('');
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle className="flex justify-center items-center">
                <ErrorOutlineIcon color="error" />
            </DialogTitle>
            <DialogContent className="flex flex-col items-center justify-center">
                {errorMessage}
            </DialogContent>
        </Dialog>
    );
}