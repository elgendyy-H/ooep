import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import api from '../services/api';

const Automation = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cron_expression: '',
    scan_config: { target_id: '', scan_type: 'full' },
    is_active: true,
  });
  const [targets, setTargets] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/automation/schedules/');
      setSchedules(response.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.response?.data?.detail || 'Failed to load schedules');
      showSnackbar('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTargets = useCallback(async () => {
    try {
      const response = await api.get('/targets/');
      setTargets(response.data);
    } catch (err) {
      console.error('Error fetching targets:', err);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchTargets();
  }, [fetchSchedules, fetchTargets]);

  const openCreateDialog = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      cron_expression: '',
      scan_config: { target_id: '', scan_type: 'full' },
      is_active: true,
    });
    setOpenDialog(true);
  };

  const openEditDialog = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      cron_expression: schedule.cron_expression,
      scan_config: schedule.scan_config,
      is_active: schedule.is_active,
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.cron_expression) {
      showSnackbar('Name and cron expression are required', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editingSchedule) {
        await api.put(`/automation/schedules/${editingSchedule.id}`, formData);
        showSnackbar('Schedule updated', 'success');
      } else {
        await api.post('/automation/schedules/', formData);
        showSnackbar('Schedule created', 'success');
      }
      handleDialogClose();
      fetchSchedules();
    } catch (err) {
      console.error('Error saving schedule:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to save schedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/automation/schedules/${id}`);
      showSnackbar('Schedule deleted', 'success');
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      showSnackbar('Failed to delete schedule', 'error');
    }
  };

  const handleToggleActive = async (schedule) => {
    try {
      const updated = { ...schedule, is_active: !schedule.is_active };
      await api.put(`/automation/schedules/${schedule.id}`, updated);
      showSnackbar(`Schedule ${updated.is_active ? 'activated' : 'paused'}`, 'success');
      fetchSchedules();
    } catch (err) {
      console.error('Error toggling schedule:', err);
      showSnackbar('Failed to update schedule', 'error');
    }
  };

  if (loading && schedules.length === 0) return <LinearProgress />;

  return (
    <Box>
      <Snackbar {...snackbar} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Automated Scans</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Create Schedule
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Cron Expression</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Scan Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Next Run</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No schedules created yet.</TableCell></TableRow>
            ) : (
              schedules.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell><code>{s.cron_expression}</code></TableCell>
                  <TableCell>{targets.find(t => t.id === s.scan_config?.target_id)?.url || '—'}</TableCell>
                  <TableCell>{s.scan_config?.scan_type || 'full'}</TableCell>
                  <TableCell>
                    <Chip label={s.is_active ? 'Active' : 'Paused'} color={s.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{s.last_run ? new Date(s.last_run).toLocaleString() : '—'}</TableCell>
                  <TableCell>{s.next_run ? new Date(s.next_run).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={s.is_active ? 'Pause' : 'Activate'}>
                      <IconButton onClick={() => handleToggleActive(s)}>
                        {s.is_active ? <Pause /> : <PlayArrow />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit"><IconButton onClick={() => openEditDialog(s)}><Edit /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton onClick={() => handleDelete(s.id)} color="error"><Delete /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/Edit */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'New Schedule'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense" label="Name" fullWidth required
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense" label="Cron Expression" fullWidth required helperText="e.g., 0 2 * * * (daily at 2 AM)"
            value={formData.cron_expression} onChange={e => setFormData({ ...formData, cron_expression: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Target</InputLabel>
            <Select
              value={formData.scan_config.target_id || ''}
              label="Target"
              onChange={e => setFormData({ ...formData, scan_config: { ...formData.scan_config, target_id: e.target.value } })}
            >
              {targets.map(t => <MenuItem key={t.id} value={t.id}>{t.url}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Scan Type</InputLabel>
            <Select
              value={formData.scan_config.scan_type}
              label="Scan Type"
              onChange={e => setFormData({ ...formData, scan_config: { ...formData.scan_config, scan_type: e.target.value } })}
            >
              <MenuItem value="full">Full Security Assessment</MenuItem>
              <MenuItem value="quick">Quick Scan</MenuItem>
              <MenuItem value="recon">Reconnaissance</MenuItem>
              <MenuItem value="api">API Security Test</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />}
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : (editingSchedule ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Automation;