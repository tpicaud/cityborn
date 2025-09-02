import { DialogContent, DialogTitle } from "@mui/material"
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Dialog } from "./Dialog";
import { Dispatch, SetStateAction } from "react";

interface ErrorDialogProps {
    errorMessage: string;
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>,
    onExited: () => void;
};

export function ErrorDialog({ errorMessage, open, setOpen, onExited }: ErrorDialogProps) {

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            slotProps={{
                transition: {
                    onExited,
                },
            }}
            fullWidth
            maxWidth="xs" // sm, md, lg, xl
            sx={{
                "& .MuiDialog-paper": {
                    width: "90%",   // prend 90% de la largeur de l’écran
                    maxWidth: 400,  // mais ne dépasse pas 400px
                    height: "auto", // ou fixe si tu veux genre 300
                    borderRadius: "1rem",
                },
            }}>
            <DialogTitle className="flex justify-center items-center">
                <ErrorOutlineIcon color="error" />
            </DialogTitle>
            <DialogContent className="flex flex-col items-center justify-center">
                {errorMessage}
            </DialogContent>
        </Dialog>
    );
}