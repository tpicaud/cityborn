'use client';

import { type CountdownOptions, useCountdown } from '@cityborn/client/game';
import { Backdrop, Typography } from '@mui/material';

export default function RoundCountdown(countdownOptions: CountdownOptions) {
  const count: number = useCountdown(countdownOptions);

  return (
    <Backdrop
      open={true}
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Typography
        variant="h1"
        component="div"
        sx={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }}
      >
        {count}
      </Typography>
    </Backdrop>
  );
}
