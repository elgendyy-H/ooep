import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Memory,
  Storage,
  Speed,
  NetworkCheck,
  Refresh,
} from '@mui/icons-material';
import api from '../services/api';

const Monitoring = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/monitoring/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to load system metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // every 10 sec
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">System Monitoring</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchMetrics} disabled={refreshing}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Memory sx={{ mr: 1 }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h4">{metrics?.memory?.percent || 0}%</Typography>
              <LinearProgress variant="determinate" value={metrics?.memory?.percent || 0} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Storage sx={{ mr: 1 }} />
                <Typography variant="h6">Disk Usage</Typography>
              </Box>
              <Typography variant="h4">{metrics?.disk?.percent || 0}%</Typography>
              <LinearProgress variant="determinate" value={metrics?.disk?.percent || 0} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Speed sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Load</Typography>
              </Box>
              <Typography variant="h4">{metrics?.cpu?.load || 0}%</Typography>
              <LinearProgress variant="determinate" value={metrics?.cpu?.load || 0} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <NetworkCheck sx={{ mr: 1 }} />
                <Typography variant="h6">API Health</Typography>
              </Box>
              <Typography variant="h4" color={metrics?.api_health === 'healthy' ? 'success.main' : 'error.main'}>
                {metrics?.api_health || 'unknown'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
        {metrics?.alerts?.length ? (
          metrics.alerts.map((alert, idx) => (
            <Alert key={idx} severity={alert.severity} sx={{ mb: 1 }}>
              {alert.message}
            </Alert>
          ))
        ) : (
          <Typography color="textSecondary">No recent alerts</Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Monitoring;