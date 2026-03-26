import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings,
  TestTube,
  Save,
  Close,
  Delete,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import api from '../services/api';

const SERVICES = ['slack', 'email', 'jira', 'github'];

const Integrations = () => {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openDialog, setOpenDialog] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [config, setConfig] = useState({});
  const [testing, setTesting] = useState(false);

  const showSnackbar = (msg, severity) => setSnackbar({ open: true, message: msg, severity });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      // Fetch existing integrations from backend
      const res = await api.get('/integrations/');
      setIntegrations(res.data);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      // If endpoint not ready, use empty object
      setIntegrations({});
    } finally {
      setLoading(false);
    }
  };

  const openConfigure = (service) => {
    setCurrentService(service);
    setConfig(integrations[service]?.config || {});
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      await api.post(`/integrations/${currentService}/configure`, {
        config_data: config,
        is_active: true,
      });
      showSnackbar(`${currentService} integration configured`, 'success');
      setOpenDialog(false);
      fetchIntegrations();
    } catch (err) {
      console.error('Error saving integration:', err);
      showSnackbar('Failed to save configuration', 'error');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await api.post(`/integrations/${currentService}/test`, config);
      if (res.data.success) {
        showSnackbar(`${currentService} test successful`, 'success');
      } else {
        showSnackbar(`${currentService} test failed`, 'error');
      }
    } catch (err) {
      console.error('Test failed:', err);
      showSnackbar('Test connection failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const getServiceIcon = (service) => {
    const icons = { slack: '💬', email: '📧', jira: '📋', github: '🐙' };
    return icons[service] || '🔌';
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Typography variant="h4" fontWeight="bold" mb={3}>Integrations</Typography>

      <Grid container spacing={3}>
        {SERVICES.map(service => (
          <Grid item xs={12} sm={6} md={3} key={service}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>{getServiceIcon(service)} {service.toUpperCase()}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {integrations[service]?.is_active ? 'Active' : 'Not configured'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => openConfigure(service)}>
                  Configure
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure {currentService?.toUpperCase()}</DialogTitle>
        <DialogContent>
          {currentService === 'slack' && (
            <TextField
              fullWidth margin="dense" label="Webhook URL" value={config.webhook_url || ''}
              onChange={e => setConfig({ ...config, webhook_url: e.target.value })}
            />
          )}
          {currentService === 'email' && (
            <>
              <TextField fullWidth margin="dense" label="SMTP Server" value={config.smtp_server || ''} onChange={e => setConfig({ ...config, smtp_server: e.target.value })} />
              <TextField fullWidth margin="dense" label="Port" type="number" value={config.smtp_port || 587} onChange={e => setConfig({ ...config, smtp_port: e.target.value })} />
              <TextField fullWidth margin="dense" label="Username" value={config.username || ''} onChange={e => setConfig({ ...config, username: e.target.value })} />
              <TextField fullWidth margin="dense" label="Password" type="password" value={config.password || ''} onChange={e => setConfig({ ...config, password: e.target.value })} />
            </>
          )}
          {currentService === 'jira' && (
            <>
              <TextField fullWidth margin="dense" label="Jira URL" value={config.url || ''} onChange={e => setConfig({ ...config, url: e.target.value })} />
              <TextField fullWidth margin="dense" label="Username" value={config.username || ''} onChange={e => setConfig({ ...config, username: e.target.value })} />
              <TextField fullWidth margin="dense" label="API Token / Password" type="password" value={config.password || ''} onChange={e => setConfig({ ...config, password: e.target.value })} />
              <TextField fullWidth margin="dense" label="Project Key" value={config.project_key || ''} onChange={e => setConfig({ ...config, project_key: e.target.value })} />
            </>
          )}
          {currentService === 'github' && (
            <>
              <TextField fullWidth margin="dense" label="Personal Access Token" type="password" value={config.token || ''} onChange={e => setConfig({ ...config, token: e.target.value })} />
              <TextField fullWidth margin="dense" label="Repository (owner/repo)" value={config.repository || ''} onChange={e => setConfig({ ...config, repository: e.target.value })} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleTest} disabled={testing} startIcon={<TestTube />}>
            {testing ? 'Testing...' : 'Test'}
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Integrations;