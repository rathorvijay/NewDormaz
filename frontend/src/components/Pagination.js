import React from 'react';
import { Box, Pagination as MuiPagination } from '@mui/material';

const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <MuiPagination
        count={pages}
        page={page}
        onChange={(e, val) => onChange(val)}
        color="primary"
        shape="rounded"
        size="large"
      />
    </Box>
  );
};

export default Pagination;
