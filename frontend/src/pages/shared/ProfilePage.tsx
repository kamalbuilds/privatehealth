import React from 'react';
import { Box, Typography } from '@mui/material';

export const ProfilePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Profile page - Coming soon...
      </Typography>
    </Box>
  );
};