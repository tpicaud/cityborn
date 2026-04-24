import {
  Button as MuiButton,
  type ButtonProps as MuiButtonProps,
} from '@mui/material';
import type { ReactNode } from 'react';

interface ButtonProps extends MuiButtonProps {
  children: ReactNode;
}

export default function Button({ children, ...props }: ButtonProps) {
  return <MuiButton {...props}>{children}</MuiButton>;
}
