import React from 'react';
import { CircularProgress, Box, Backdrop } from '@mui/material';

const LoadingComponent = () => {
  return (
    <Backdrop open={true}>
        <Box className="flex flex-col justify-center items-center gap-5 px-12 py-8 bg-slate-100 shadow-xl rounded-2xl">
            <CircularProgress />
            <p>Loading</p>
        </Box>
    </Backdrop>
  );
};

export default LoadingComponent;
