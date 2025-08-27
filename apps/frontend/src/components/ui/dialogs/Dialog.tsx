import { Dialog as MuiDialog, DialogProps as MuiDialogProps } from "@mui/material";
import { ReactNode } from "react";

interface DialogProps extends MuiDialogProps {
    open: boolean,
    children: ReactNode
}

export function Dialog({
    open,
    children,
    ...props
}: DialogProps) {
    return (
        <MuiDialog
            open={open}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '1rem',
                    }
                }
            }}
            {...props}
        >
            {children}
        </MuiDialog >
    )
}