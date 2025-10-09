import { Card as MuiCard } from '@mui/material';
import { ReactNode } from "react";
import clsx from 'clsx';

interface CardProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'accent';
    size?: 'sm' | 'md' | 'lg' | 'auto';
    className?: string;
    disabled?: boolean;
    onClick?: () => Promise<void>;
}

// Base styles
const baseCardStyle = '';
const baseTextStyle = 'font-sans font-bold text-neutral text-shadow-[0_0px_10px_rgba(0_0_0_/_0.65)]'

// Variant styles
const variantStyles: Record<string, string> = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    accent: 'bg-gradient-accent',
    disabled: 'bg-neutral-600'
};

// Size styles
const sizeStyles: Record<string, string> = {
    sm: 'p-3 rounded-lg shadow-[0_0_10px_5px_rgba(0,0,0,0.12)]',
    md: 'p-4 rounded-xl shadow-[0_0_15px_5px_rgba(0,0,0,0.17)]',
    lg: 'p-6 rounded-2xl shadow-[0_0_15px_5px_rgba(0,0,0,0.20)]',
};

const textStyles: Record<string, string> = {
    sm: 'text-sm font-sans font-bold text-neutral',
    md: 'text-md font-sans font-bold text-neutral',
    lg: 'text-lg font-sans font-bold text-neutral',
};

export default function Card({
    children,
    variant = 'primary',
    size = 'auto',
    className = '',
    disabled = false,
    ...props
}: CardProps) {

    const variantClass = variantStyles[variant];
    const sizeClass = (size === 'auto') ? `${sizeStyles['sm']} md:${sizeStyles['md']} lg:${sizeStyles['lg']}` : sizeStyles[size];
    const textClass = (size === 'auto') ? `${textStyles['sm']} md:${textStyles['md']} lg:${textStyles['lg']}` : textStyles[size];

    return (
        <MuiCard
            className={clsx(
                baseCardStyle,
                variantClass,
                sizeClass,
                textClass,
                className
            )}
            {...props}
        >
            {children}
        </MuiCard>
    )
}