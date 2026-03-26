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
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Refresh,
  Search,
  Close,
  Edit,
  Save,
  Cancel,
  FilterList,
  Clear,
} from '@mui/icons-material';
import api from '../services/api';

const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'];
const SEVERITY_COLORS = {
  critical: 'error',
  high: 'warning',
  medium: 'default',
  low: 'success',
  info: 'info',
};
const STATUS_OPTIONS = ['open', 'closed', 'accepted'];

const Findings = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    scan_id: '',
    search: '',
  });
  const [scans, setScans] = useState([]); // for scan filter dropdown
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchFindings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      if (filters.scan_id) params.append('scan_id', filters.scan_id);
      if (filters.search) params.append('search', filters.search); // backend may need to support search
      const response = await api.get(`/findings/?${params.toString()}`);
      setFindings(response.data);
    } catch (err) {
      console.error('Error fetching findings:', err);
      setError(err.response?.data?.detail || 'Failed to load findings');
      showSnackbar('Failed to load findings', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchScans = useCallback(async () => {
    try {
      const response = await api.get('/scans/');
      setScans(response.data);
    } catch (err) {
      console.error('Error fetching scans for filter:', err);
    }
  }, []);

  useEffect(() => {
    fetchFindings();
    fetchScans();
  }, [fetchFindings, fetchScans]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ severity: '', status: '', scan_id: '', search: '' });
  };

  const handleUpdateStatus = async (findingId, newStatus) => {
    try {
      await api.put(`/findings/${findingId}`, { status: newStatus });
      showSnackbar('Finding status updated', 'success');
      fetchFindings(); // refresh list
    } catch (err) {
      console.error('Error updating finding:', err);
      showSnackbar('Failed to update status', 'error');
    } finally {
      setEditingId(null);
    }
  };

  const startEdit = (finding) => {
    setEditingId(finding.id);
    setEditStatus(finding.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (findingId) => {
    handleUpdateStatus(findingId, editStatus);
  };

  if (loading && findings.length === 0) {
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
        <Typography variant="h4" fontWeight="bold">Findings</Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchFindings}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={filters.severity}
                label="Severity"
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {SEVERITY_LEVELS.map(level => (
                  <MenuItem key={level} value={level}>{level.toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {STATUS_OPTIONS.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt.toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Scan</InputLabel>
              <Select
                value={filters.scan_id}
                label="Scan"
                onChange={(e) => handleFilterChange('scan_id', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {scans.map(scan => (
                  <MenuItem key={scan.id} value={scan.id}>#{scan.id} - {scan.target_url}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleFilterChange('search', '')}>
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={clearFilters}
              size="small"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Scan ID</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {findings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No findings match the filters.</TableCell>
              </TableRow>
            ) : (
              findings.map((finding) => (
                <TableRow key={finding.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {finding.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {finding.description?.substring(0, 100)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={finding.severity}
                      color={SEVERITY_COLORS[finding.severity] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === finding.id ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <MenuItem key={opt} value={opt}>{opt.toUpperCase()}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={finding.status}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>#{finding.scan_id}</TableCell>
                  <TableCell>{finding.location || '—'}</TableCell>
                  <TableCell>
                    {editingId === finding.id ? (
                      <>
                        <Tooltip title="Save">
                          <IconButton onClick={() => saveEdit(finding.id)} color="primary">
                            <Save />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton onClick={cancelEdit}>
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title="Edit Status">
                        <IconButton onClick={() => startEdit(finding)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Findings;