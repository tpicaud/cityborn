import { Button, ButtonProps } from '@mui/material';
import { ReactNode, useState } from 'react';

interface LoadingButtonProps extends ButtonProps {
  onClick: () => Promise<void> | void;
  children: ReactNode;
}

export default function LoadingButton({
  onClick,
  children,
  ...props
}: LoadingButtonProps) {
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
    <Button onClick={handleClick} loading={loading} {...props}>
      {children}
    </Button>
  );
}
