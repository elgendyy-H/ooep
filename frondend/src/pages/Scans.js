import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Stop,
  Delete,
  Refresh,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SCAN_TYPES = [
  { value: 'full', label: 'Full Security Assessment' },
  { value: 'quick', label: 'Quick Scan' },
  { value: 'recon', label: 'Reconnaissance Only' },
  { value: 'api', label: 'API Security Test' },
];

const MODULES = [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10',
];

const Scans = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openCreate, setOpenCreate] = useState(false);
  const [newScan, setNewScan] = useState({
    target_url: '',
    scan_type: 'full',
    modules: [],
  });
  const [creating, setCreating] = useState(false);
  const [startingScanId, setStartingScanId] = useState(null);
  const [webSocket, setWebSocket] = useState(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/scans`);
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'scan_update') {
        // Update the scan status in the list
        setScans(prev => prev.map(scan => 
          scan.id === data.scan_id ? { ...scan, status: data.status, findings_count: data.findings_count } : scan
        ));
        showSnackbar(`Scan ${data.scan_id} status: ${data.status}`, 'info');
      }
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    setWebSocket(ws);
    return () => ws.close();
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/scans/');
      setScans(response.data);
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError(err.response?.data?.detail || 'Failed to load scans');
      showSnackbar('Failed to load scans', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
    // Poll every 5 seconds for updates (fallback if WebSocket not connected)
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, [fetchScans]);

  const handleCreateScan = async () => {
    if (!newScan.target_url) {
      showSnackbar('Target URL is required', 'error');
      return;
    }
    try {
      setCreating(true);
      const response = await api.post('/scans/', newScan);
      showSnackbar('Scan created successfully', 'success');
      setOpenCreate(false);
      setNewScan({ target_url: '', scan_type: 'full', modules: [] });
      await fetchScans(); // Refresh list
    } catch (err) {
      console.error('Error creating scan:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to create scan', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStartScan = async (scanId) => {
    try {
      setStartingScanId(scanId);
      const response = await api.post(`/scans/${scanId}/start`);
      showSnackbar(`Scan started: ${response.data.message}`, 'success');
      // Update local status to 'running'
      setScans(prev => prev.map(scan => 
        scan.id === scanId ? { ...scan, status: 'running', started_at: new Date().toISOString() } : scan
      ));
    } catch (err) {
      console.error('Error starting scan:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to start scan', 'error');
    } finally {
      setStartingScanId(null);
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm('Are you sure you want to delete this scan?')) return;
    try {
      await api.delete(`/scans/${scanId}`);
      showSnackbar('Scan deleted', 'success');
      fetchScans();
    } catch (err) {
      console.error('Error deleting scan:', err);
      showSnackbar('Failed to delete scan', 'error');
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  if (loading && scans.length === 0) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Scans</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchScans}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreate(true)}
          >
            New Scan
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Findings</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No scans found. Create your first scan.</TableCell>
              </TableRow>
            ) : (
              scans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell>{scan.id}</TableCell>
                  <TableCell>{scan.target_url}</TableCell>
                  <TableCell>{scan.scan_type}</TableCell>
                  <TableCell>
                    <Chip
                      label={scan.status}
                      color={getStatusChipColor(scan.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{scan.findings_count || 0}</TableCell>
                  <TableCell>{formatDate(scan.started_at)}</TableCell>
                  <TableCell>{formatDate(scan.completed_at)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton onClick={() => navigate(`/scans/${scan.id}`)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {scan.status !== 'running' && (
                      <Tooltip title="Start Scan">
                        <IconButton
                          onClick={() => handleStartScan(scan.id)}
                          disabled={startingScanId === scan.id}
                          color="primary"
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    {scan.status === 'running' && (
                      <Tooltip title="Stop Scan">
                        <IconButton color="error">
                          <Stop />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteScan(scan.id)} color="error">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Scan Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Scan</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Target URL"
            type="url"
            fullWidth
            variant="outlined"
            value={newScan.target_url}
            onChange={(e) => setNewScan({ ...newScan, target_url: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Scan Type</InputLabel>
            <Select
              value={newScan.scan_type}
              label="Scan Type"
              onChange={(e) => setNewScan({ ...newScan, scan_type: e.target.value })}
            >
              {SCAN_TYPES.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Modules (optional)</InputLabel>
            <Select
              multiple
              value={newScan.modules}
              label="Modules"
              onChange={(e) => setNewScan({ ...newScan, modules: e.target.value })}
              renderValue={(selected) => selected.join(', ')}
            >
              {MODULES.map(module => (
                <MenuItem key={module} value={module}>{module}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateScan} variant="contained" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Scans;