import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Security,
  HealthAndSafety,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { login } from '@/store/slices/authSlice';
import { connectWallet } from '@/store/slices/walletSlice';
import { showSnackbar } from '@/store/slices/uiSlice';
import { ROUTES } from '@/utils/constants';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const { connection, isConnecting } = useAppSelector((state) => state.wallet);

  const [loginMethod, setLoginMethod] = useState<'wallet' | 'email'>('wallet');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleWalletLogin = async () => {
    try {
      // First connect wallet
      const walletConnection = await dispatch(connectWallet()).unwrap();

      // Then sign a message for authentication
      const message = `Login to PrivateHealth at ${new Date().toISOString()}`;
      // This would use the wallet service to sign the message
      const signature = 'dummy_signature_for_demo';

      // Login with wallet address and signature
      await dispatch(login({
        address: walletConnection.address!,
        signature,
      })).unwrap();

      dispatch(showSnackbar({
        message: 'Successfully logged in with wallet',
        severity: 'success',
      }));

      navigate('/');
    } catch (error: any) {
      dispatch(showSnackbar({
        message: error.message || 'Failed to login with wallet',
        severity: 'error',
      }));
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // For demo purposes, this would integrate with traditional auth
    dispatch(showSnackbar({
      message: 'Email login not implemented in demo',
      severity: 'info',
    }));
  };

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
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <HealthAndSafety sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              PrivateHealth
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Privacy-First Healthcare Data Platform
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Wallet Login */}
          <Card sx={{ mb: 3, border: loginMethod === 'wallet' ? 2 : 1, borderColor: loginMethod === 'wallet' ? 'primary.main' : 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWallet sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Connect with Wallet
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use your Midnight wallet for secure, privacy-preserving authentication
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleWalletLogin}
                disabled={isLoading || isConnecting}
                startIcon={isConnecting ? <CircularProgress size={16} /> : <AccountBalanceWallet />}
                sx={{ py: 1.5 }}
              >
                {isConnecting ? 'Connecting...' : connection.isConnected ? 'Sign Message to Login' : 'Connect Wallet'}
              </Button>
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Email Login */}
          <Card sx={{ border: loginMethod === 'email' ? 2 : 1, borderColor: loginMethod === 'email' ? 'primary.main' : 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Email Login
                </Typography>
              </Box>
              <Box component="form" onSubmit={handleEmailLogin} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="outlined"
                  fullWidth
                  disabled={isLoading}
                  sx={{ py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Login with Email'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} style={{ color: 'inherit', fontWeight: 'bold' }}>
                Sign up here
              </Link>
            </Typography>
          </Box>

          {/* Features */}
          <Box sx={{ mt: 4, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom textAlign="center">
              Why PrivateHealth?
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Security color="primary" sx={{ mb: 1 }} />
                <Typography variant="caption" display="block">
                  Zero-Knowledge Privacy
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <AccountBalanceWallet color="primary" sx={{ mb: 1 }} />
                <Typography variant="caption" display="block">
                  Earn from Your Data
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <HealthAndSafety color="primary" sx={{ mb: 1 }} />
                <Typography variant="caption" display="block">
                  Advance Research
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};