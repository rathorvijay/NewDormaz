import React from 'react';
import { Rating, Box, Typography } from '@mui/material';

const RatingStars = ({ value, numReviews, size = 'medium' }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Rating value={Number(value) || 0} readOnly size={size} precision={0.5} />
      {numReviews !== undefined && (
        <Typography variant="body2" color="text.secondary">
          ({numReviews} review{numReviews !== 1 ? 's' : ''})
        </Typography>
      )}
    </Box>
  );
};

export default RatingStars;
