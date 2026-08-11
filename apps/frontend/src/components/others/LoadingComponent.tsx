'use client';

import { Backdrop, Box, CircularProgress } from '@mui/material';

const LoadingComponent = ({ message }: { message?: string }) => {
  return (
    <Backdrop open={true}>
      <Box className="flex flex-col justify-center items-center gap-5 px-12 py-8 bg-slate-100 shadow-xl rounded-2xl">
        <CircularProgress />
        {message && <p>{message}</p>}
      </Box>
    </Backdrop>
  );
};

export default LoadingComponent;
