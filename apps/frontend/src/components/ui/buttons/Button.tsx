import { Button as MuiButton } from "@mui/material";
import { ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'accent' | 'custom';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const variantStyles: Record<string, string> = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    accent: 'bg-gradient-accent',
    custom: '',
};

const sizeStyles: Record<string, string> = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-md',
    lg: 'px-6 py-3 text-lg',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}: ButtonProps) {

    return (
        <MuiButton
            className={clsx(variantStyles[variant], sizeStyles[size], className)}
            {...props}
        >
            {children}
        </MuiButton>
    )
}