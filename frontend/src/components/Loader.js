import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Bedtime } from '@mui/icons-material';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
      <CircularProgress size={50} thickness={4} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Bedtime color="primary" />
        <Typography variant="body1" color="text.secondary">{message}</Typography>
      </Box>
    </Box>
  );
};

export default Loader;
