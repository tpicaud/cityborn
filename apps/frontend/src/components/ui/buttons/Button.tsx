import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material";
import { ReactNode } from "react";

interface ButtonProps extends MuiButtonProps {
    children: ReactNode;
}

export default function Button({
    children,
    ...props
}: ButtonProps) {

    return (
        <MuiButton
            {...props}
        >
            {children}
        </MuiButton>
    )
}