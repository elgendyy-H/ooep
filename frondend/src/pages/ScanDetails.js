import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Grid,
  Alert,
  Snackbar,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh,
  PlayArrow,
  ArrowBack,
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

const ScanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    search: '',
  });
  const [rerunning, setRerunning] = useState(false);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchScanDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [scanRes, findingsRes] = await Promise.all([
        api.get(`/scans/${id}`),
        api.get(`/findings/?scan_id=${id}`),
      ]);
      setScan(scanRes.data);
      setFindings(findingsRes.data);
    } catch (err) {
      console.error('Error fetching scan details:', err);
      setError(err.response?.data?.detail || 'Failed to load scan details');
      showSnackbar('Failed to load scan details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchScanDetails();
  }, [fetchScanDetails]);

  const handleReRun = async () => {
    try {
      setRerunning(true);
      // Create a new scan with same target and config
      const response = await api.post('/scans/', {
        target_url: scan.target_url,
        scan_type: scan.scan_type,
        config: scan.config ? JSON.parse(scan.config) : {},
      });
      showSnackbar('New scan created successfully', 'success');
      // Navigate to the new scan
      navigate(`/scans/${response.data.id}`);
    } catch (err) {
      console.error('Error re-running scan:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to re-run scan', 'error');
    } finally {
      setRerunning(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ severity: '', status: '', search: '' });
  };

  const filteredFindings = findings.filter(finding => {
    if (filters.severity && finding.severity !== filters.severity) return false;
    if (filters.status && finding.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return finding.title.toLowerCase().includes(searchLower) ||
             finding.description.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  if (loading && !scan) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchScanDetails}>Retry</Button>
      </Box>
    );
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

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/scans')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Scan #{id}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handleReRun}
          disabled={rerunning}
        >
          {rerunning ? 'Creating...' : 'Re-run Scan'}
        </Button>
      </Box>

      {/* Scan Metadata Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary">Target</Typography>
              <Typography variant="body1">{scan?.target_url}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Scan Type</Typography>
              <Typography variant="body1">{scan?.scan_type}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Status</Typography>
              <Chip
                label={scan?.status}
                color={scan?.status === 'completed' ? 'success' : scan?.status === 'running' ? 'primary' : 'default'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Started</Typography>
              <Typography variant="body1">{formatDate(scan?.started_at)}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Completed</Typography>
              <Typography variant="body1">{formatDate(scan?.completed_at)}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Modules</Typography>
              <Typography variant="body1">
                {scan?.config ? JSON.parse(scan.config)?.modules?.join(', ') || 'All' : 'All'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Findings Section */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Findings ({filteredFindings.length})</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              sx={{ width: 200 }}
            />
            <Tooltip title="Clear filters">
              <IconButton onClick={clearFilters}>
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>CVSS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFindings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No findings match the filters.</TableCell>
                </TableRow>
              ) : (
                filteredFindings.map((finding) => (
                  <TableRow key={finding.id} hover>
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
                    <TableCell>{finding.status}</TableCell>
                    <TableCell>{finding.location || '—'}</TableCell>
                    <TableCell>{finding.cvss_score || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ScanDetails;