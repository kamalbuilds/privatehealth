import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { HealthAndSafety } from '@mui/icons-material';

export const RegisterPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <HealthAndSafety sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Register for PrivateHealth
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registration page - Coming soon...
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};