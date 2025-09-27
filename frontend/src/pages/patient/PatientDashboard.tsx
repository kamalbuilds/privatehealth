import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Security,
  AccountBalanceWallet,
  TrendingUp,
  Description,
  Visibility,
  People,
  Science,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchRecords } from '@/store/slices/recordsSlice';
import { fetchActiveConsents } from '@/store/slices/consentSlice';
import { setPageTitle } from '@/store/slices/uiSlice';
import { ROUTES } from '@/utils/constants';
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator/PrivacyIndicator';

// Temporary placeholder component until we create the full dashboard
export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { records } = useAppSelector((state) => state.records);
  const { activeConsents } = useAppSelector((state) => state.consent);
  const { connection } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(setPageTitle('Patient Dashboard'));
    dispatch(fetchRecords({ limit: 5 }));
    dispatch(fetchActiveConsents());
  }, [dispatch]);

  // Mock stats - these would come from actual API calls
  const stats = {
    totalRecords: records.length,
    activeConsents: activeConsents.length,
    totalEarnings: 1250.75,
    dataShared: 8,
    privacyScore: 95,
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.profile.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your health data securely and earn from contributing to research.
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{stats.totalRecords}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Health Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{stats.activeConsents}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Active Consents
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWallet color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">${stats.totalEarnings}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Security color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">{stats.privacyScore}%</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Privacy Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CloudUpload />}
                    onClick={() => navigate(ROUTES.PATIENT_UPLOAD)}
                  >
                    Upload Data
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Visibility />}
                    onClick={() => navigate(ROUTES.PATIENT_RECORDS)}
                  >
                    View Records
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<People />}
                    onClick={() => navigate(ROUTES.PATIENT_CONSENTS)}
                  >
                    Manage Consents
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUp />}
                    onClick={() => navigate(ROUTES.PATIENT_EARNINGS)}
                  >
                    View Earnings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CloudUpload color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Uploaded medical record"
                    secondary="2 hours ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <People color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="New consent request approved"
                    secondary="1 day ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccountBalanceWallet color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Earned $50 from research contribution"
                    secondary="3 days ago"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Privacy Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Privacy Score: {stats.privacyScore}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.privacyScore}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <PrivacyIndicator level="private" size="small" />
                <PrivacyIndicator level="restricted" size="small" />
                <PrivacyIndicator level="public" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Wallet Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Wallet Status
              </Typography>
              {connection.isConnected ? (
                <Box>
                  <Chip
                    icon={<AccountBalanceWallet />}
                    label="Connected"
                    color="success"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Balance: {connection.balance?.toFixed(4) || '0'} DUST
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Network: {connection.network || 'Unknown'}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="warning">
                  Wallet not connected. Connect your wallet to earn from data sharing.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};