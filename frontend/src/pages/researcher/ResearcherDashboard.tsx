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
  Science,
  Dataset,
  RequestPage,
  AccountBalanceWallet,
  TrendingUp,
  Assignment,
  Visibility,
  People,
  Analytics,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchProposals } from '@/store/slices/researchSlice';
import { setPageTitle } from '@/store/slices/uiSlice';
import { ROUTES } from '@/utils/constants';

export const ResearcherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { proposals } = useAppSelector((state) => state.research);
  const { connection } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(setPageTitle('Researcher Dashboard'));
    dispatch(fetchProposals({ limit: 5 }));
  }, [dispatch]);

  // Mock stats - these would come from actual API calls
  const stats = {
    activeProposals: proposals.filter(p => p.status === 'active').length,
    approvedRequests: 15,
    totalBudget: 50000,
    datasetsAccessed: 12,
    publicationsCount: 3,
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.profile.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access privacy-preserving healthcare data for your research projects.
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Science color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{stats.activeProposals}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Active Proposals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RequestPage color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{stats.approvedRequests}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Approved Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWallet color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">${stats.totalBudget.toLocaleString()}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Budget
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Dataset color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">{stats.datasetsAccessed}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Datasets Accessed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{stats.publicationsCount}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Publications
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
                    startIcon={<Science />}
                    onClick={() => navigate(ROUTES.RESEARCHER_PROPOSALS)}
                  >
                    New Proposal
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Dataset />}
                    onClick={() => navigate(ROUTES.RESEARCHER_DATASETS)}
                  >
                    Browse Data
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<RequestPage />}
                    onClick={() => navigate(ROUTES.RESEARCHER_REQUESTS)}
                  >
                    Data Requests
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Analytics />}
                    onClick={() => navigate(ROUTES.RESEARCHER_RESULTS)}
                  >
                    View Results
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
                    <Science color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Proposal 'Diabetes Study' approved"
                    secondary="2 hours ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <RequestPage color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="New data request approved"
                    secondary="1 day ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Download color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Downloaded dataset for cardiovascular research"
                    secondary="3 days ago"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Used: $32,500
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Remaining: $17,500
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={65}
                  color="primary"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(ROUTES.RESEARCHER_BUDGET)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Proposals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Proposals
              </Typography>
              <List dense>
                {proposals.slice(0, 3).map((proposal, index) => (
                  <ListItem key={proposal.id}>
                    <ListItemIcon>
                      <Science color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={proposal.title}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={proposal.status}
                            size="small"
                            color={proposal.status === 'active' ? 'success' : 'default'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Budget: ${proposal.budget.toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(ROUTES.RESEARCHER_PROPOSALS)}
              >
                View All Proposals
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};