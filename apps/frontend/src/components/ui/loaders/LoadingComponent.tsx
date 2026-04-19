import { Box, CircularProgress } from '@mui/material';
import React from 'react';
import { Dialog } from '../dialogs/Dialog';

const LoadingComponent = ({ message }: { message?: string }) => {
  return (
    <Dialog open={true}>
      <Box className="flex flex-col justify-center items-center gap-5 px-12 py-8 bg-slate-100 shadow-xl rounded-2xl">
        <CircularProgress />
        {message && <p>{message}</p>}
      </Box>
    </Dialog>
  );
};

export default LoadingComponent;
