import { IconButton as MuiIconButton, IconButtonProps as MuiIconButtonProps } from "@mui/material";
import { ReactNode } from "react";

interface IconButtonProps extends MuiIconButtonProps {
    onClick?: () => Promise<void> | void;
    children: ReactNode;
}

export default function IconButton({
    onClick,
    children,
    ...props
}: IconButtonProps) {

    return (
        <MuiIconButton
            onClick={onClick}
            {...props}
        >
            {children}
        </MuiIconButton>
    )
}