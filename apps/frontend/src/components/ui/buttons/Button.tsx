import { CircularProgress, Button as MuiButton } from "@mui/material";
import { ReactNode, useState } from "react";
import clsx from "clsx";

interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'accent';
    size?: 'sm' | 'md' | 'lg' | 'auto';
    className?: string;
    disabled?: boolean;
    onClick?: () => Promise<void>;
}

const className = 'text-shadow-'

// Base styles
const baseButtonStyle = 'transition-transform duration-200 ease-in-out transform hover:scale-105';
const baseTextStyle = 'font-sans font-bold text-neutral text-shadow-[0_0px_10px_rgba(0_0_0_/_0.65)]'

// Variant styles
const variantStyles: Record<string, string> = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    accent: 'bg-gradient-accent',
    disabled: 'bg-neutral-600'
};

// Disabled style
const disabledStyle = 'bg-neutral-700 shadow-none filter grayscale';

// Size styles
const sizeStyles: Record<string, string> = {
    sm: 'px-5 py-1 min-w-[6rem] min-h-[2rem] rounded-lg shadow-[0_0_10px_5px_rgba(0,0,0,0.15)]',
    md: 'px-6 py-2 min-w-[8rem] min-h-[2.5rem] rounded-xl shadow-[0_0_15px_5px_rgba(0,0,0,0.2)]',
    lg: 'px-8 py-3 min-w-[10rem] min-h-[3rem] rounded-2xl shadow-[0_0_15px_5px_rgba(0,0,0,0.22)]',
};

const textStyles: Record<string, string> = {
    sm: 'text-sm font-sans font-bold text-neutral',
    md: 'text-md font-sans font-bold text-neutral',
    lg: 'text-lg font-sans font-bold text-neutral',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'auto',
    className = '',
    disabled = false,
    onClick = async () => { },
    ...props
}: ButtonProps) {

    const variantClass = disabled ? disabledStyle : variantStyles[variant];
    const sizeClass = (size === 'auto') ? `${sizeStyles['sm']} md:${sizeStyles['md']} lg:${sizeStyles['lg']}` : sizeStyles[size];
    const textClass = (size === 'auto') ? `${textStyles['sm']} md:${textStyles['md']} lg:${textStyles['lg']}` : textStyles[size];

    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        try {
            setLoading(true);
            await onClick();
        } finally {
            setLoading(false);
        }
    }

    return (

        <MuiButton
            className={clsx(
                baseButtonStyle,
                variantClass,
                sizeClass,
                className
            )}
            disabled={disabled || loading}
            onClick={handleClick}
            {...props}
        >
            <span className={clsx(baseTextStyle, textClass)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                    <CircularProgress
                        size={'1.5em'}
                        color="inherit"
                        thickness={6}
                        style={{ position: 'absolute' }}
                    />
                ) : null}
                <span style={{ opacity: loading ? 0 : 1 }}>
                    {children}
                </span>
            </span>
        </MuiButton>
    )
}