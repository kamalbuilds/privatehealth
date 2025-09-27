import React, { useEffect } from 'react';
import {
  Button,
  Chip,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalanceWallet,
  ContentCopy,
  Launch,
  Refresh,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/store';
import { connectWallet, disconnectWallet, getBalance } from '@/store/slices/walletSlice';
import { showSnackbar } from '@/store/slices/uiSlice';
import { NETWORKS } from '@/utils/constants';

export const WalletConnection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { connection, isConnecting, error } = useAppSelector((state) => state.wallet);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  useEffect(() => {
    // Auto-connect if wallet was previously connected
    if (connection.address && !connection.isConnected) {
      dispatch(connectWallet());
    }
  }, [dispatch, connection.address, connection.isConnected]);

  const handleConnect = async () => {
    try {
      await dispatch(connectWallet()).unwrap();
      dispatch(showSnackbar({
        message: 'Wallet connected successfully',
        severity: 'success',
      }));
    } catch (error: any) {
      dispatch(showSnackbar({
        message: error.message || 'Failed to connect wallet',
        severity: 'error',
      }));
    }
  };

  const handleDisconnect = async () => {
    try {
      await dispatch(disconnectWallet()).unwrap();
      setDialogOpen(false);
      dispatch(showSnackbar({
        message: 'Wallet disconnected',
        severity: 'info',
      }));
    } catch (error: any) {
      dispatch(showSnackbar({
        message: error.message || 'Failed to disconnect wallet',
        severity: 'error',
      }));
    }
  };

  const handleRefreshBalance = async () => {
    if (connection.address) {
      try {
        await dispatch(getBalance(connection.address)).unwrap();
        dispatch(showSnackbar({
          message: 'Balance refreshed',
          severity: 'success',
        }));
      } catch (error: any) {
        dispatch(showSnackbar({
          message: 'Failed to refresh balance',
          severity: 'error',
        }));
      }
    }
  };

  const handleCopyAddress = async () => {
    if (connection.address) {
      try {
        await navigator.clipboard.writeText(connection.address);
        dispatch(showSnackbar({
          message: 'Address copied to clipboard',
          severity: 'success',
        }));
      } catch (error) {
        dispatch(showSnackbar({
          message: 'Failed to copy address',
          severity: 'error',
        }));
      }
    }
  };

  const handleViewOnExplorer = () => {
    if (connection.address && connection.network) {
      const network = Object.values(NETWORKS).find(n => n.name === connection.network);
      if (network) {
        window.open(`${network.blockExplorer}/address/${connection.address}`, '_blank');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number | undefined) => {
    if (balance === undefined) return '0';
    return balance.toFixed(4);
  };

  if (!connection.isConnected) {
    return (
      <Button
        variant="outlined"
        color="inherit"
        startIcon={isConnecting ? <CircularProgress size={16} /> : <AccountBalanceWallet />}
        onClick={handleConnect}
        disabled={isConnecting}
        sx={{
          borderColor: 'rgba(255, 255, 255, 0.5)',
          color: 'inherit',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.8)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <>
      <Chip
        icon={<AccountBalanceWallet />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" component="span">
              {formatAddress(connection.address!)}
            </Typography>
            <Typography variant="body2" component="span" sx={{ opacity: 0.8 }}>
              {formatBalance(connection.balance)} DUST
            </Typography>
          </Box>
        }
        onClick={() => setDialogOpen(true)}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
          },
          '& .MuiChip-icon': {
            color: 'inherit',
          },
        }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet />
            Wallet Details
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Wallet Address
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: 1,
                  borderRadius: 1,
                  flex: 1,
                  wordBreak: 'break-all',
                }}
              >
                {connection.address}
              </Typography>
              <Tooltip title="Copy Address">
                <IconButton size="small" onClick={handleCopyAddress}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View on Explorer">
                <IconButton size="small" onClick={handleViewOnExplorer}>
                  <Launch fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Balance
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">
                {formatBalance(connection.balance)} DUST
              </Typography>
              <Tooltip title="Refresh Balance">
                <IconButton size="small" onClick={handleRefreshBalance}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {connection.network && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Network
              </Typography>
              <Chip
                label={connection.network}
                color={connection.network.includes('testnet') ? 'warning' : 'success'}
                size="small"
              />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          <Button
            onClick={handleDisconnect}
            color="error"
            variant="outlined"
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};