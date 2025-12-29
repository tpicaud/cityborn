'use client';

import { Input as MuiInput } from '@mui/material';

interface TextInputProps {
  placeholder: string;
  className: string;
}

export default function Input({
  placeholder = '',
  className = '',
}: TextInputProps) {
  return (
    <MuiInput
      placeholder={placeholder}
      className={className}
      disableUnderline
    />
  );
}
