import { IconButton, type IconButtonProps } from '@mui/material';
import { type ReactNode, useState } from 'react';

interface LoadingIconButtonProps extends IconButtonProps {
  onClick: () => Promise<void> | void;
  children: ReactNode;
}

export default function LoadingIconButton({
  onClick,
  children,
  ...props
}: LoadingIconButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await onClick();
    } finally {
      setLoading(false);
    }
  };
  return (
    <IconButton onClick={handleClick} loading={loading} {...props}>
      {children}
    </IconButton>
  );
}
