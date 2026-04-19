import {
  IconButton as MuiIconButton,
  type IconButtonProps as MuiIconButtonProps,
} from '@mui/material';
import type { ReactNode } from 'react';

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
    <MuiIconButton onClick={onClick} {...props}>
      {children}
    </MuiIconButton>
  );
}
