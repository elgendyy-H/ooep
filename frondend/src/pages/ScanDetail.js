import React, { useState, useEffect } from 'react';
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
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Delete,
  GetApp,
  Refresh,
  Warning,
} from '@mui/icons-material';
import api from '../services/api';

const ScanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportFormat, setReportFormat] = useState('html');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [startingScan, setStartingScan] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchScanAndFindings = async () => {
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
  };

  useEffect(() => {
    fetchScanAndFindings();
  }, [id]);

  const handleStartScan = async () => {
    try {
      setStartingScan(true);
      const response = await api.post(`/scans/${id}/start`);
      showSnackbar(`Scan started: ${response.data.message}`, 'success');
      // Optionally refresh after a few seconds
      setTimeout(fetchScanAndFindings, 2000);
    } catch (err) {
      console.error('Error starting scan:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to start scan', 'error');
    } finally {
      setStartingScan(false);
    }
  };

  const handleDeleteScan = async () => {
    if (!window.confirm('Are you sure you want to delete this scan? All findings will be permanently removed.')) return;
    try {
      setDeleting(true);
      await api.delete(`/scans/${id}`);
      showSnackbar('Scan deleted successfully', 'success');
      navigate('/scans');
    } catch (err) {
      console.error('Error deleting scan:', err);
      showSnackbar('Failed to delete scan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await api.post('/reports/generate', {
        scan_ids: [parseInt(id)],
        report_type: reportFormat,
        include_charts: true,
      });
      showSnackbar('Report generation started', 'success');
      setOpenReportDialog(false);
      // In a real app, you might poll for the report or return a download URL
      // For now, we assume the response contains a download URL
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      showSnackbar('Failed to generate report', 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  const filteredFindings = findings.filter(finding => {
    if (filterSeverity !== 'all' && finding.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && finding.status !== filterStatus) return false;
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

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
        <Button variant="contained" onClick={fetchScanAndFindings}>Retry</Button>
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

      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/scans')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">Scan Details</Typography>
      </Box>

      {/* Scan Summary Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Scan Information</Typography>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
          <Box><strong>ID:</strong> {scan.id}</Box>
          <Box><strong>Target:</strong> {scan.target_url}</Box>
          <Box><strong>Type:</strong> {scan.scan_type}</Box>
          <Box><strong>Status:</strong> <Chip label={scan.status} color={scan.status === 'completed' ? 'success' : scan.status === 'running' ? 'primary' : 'default'} size="small" /></Box>
          <Box><strong>Started:</strong> {formatDate(scan.started_at)}</Box>
          <Box><strong>Completed:</strong> {formatDate(scan.completed_at)}</Box>
          <Box><strong>Total Findings:</strong> {scan.findings_count}</Box>
          <Box><strong>Critical Findings:</strong> {scan.critical_findings}</Box>
        </Box>
        <Box mt={2} display="flex" gap={2}>
          {scan.status !== 'running' && (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStartScan}
              disabled={startingScan}
            >
              {startingScan ? 'Starting...' : 'Run Again'}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={() => setOpenReportDialog(true)}
          >
            Generate Report
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteScan}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Scan'}
          </Button>
        </Box>
      </Paper>

      {/* Findings Section */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Findings</Typography>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={filterSeverity}
                label="Severity"
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchScanAndFindings}>
              Refresh
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remediation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFindings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No findings to display</TableCell>
                </TableRow>
              ) : (
                filteredFindings.map((finding) => (
                  <TableRow key={finding.id}>
                    <TableCell>{finding.title}</TableCell>
                    <TableCell>
                      <Chip label={finding.severity} color={getSeverityColor(finding.severity)} size="small" />
                    </TableCell>
                    <TableCell>{finding.location || '—'}</TableCell>
                    <TableCell>{finding.status}</TableCell>
                    <TableCell>{finding.remediation || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Report Generation Dialog */}
      <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)}>
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Report Format</InputLabel>
            <Select
              value={reportFormat}
              label="Report Format"
              onChange={(e) => setReportFormat(e.target.value)}
            >
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReportDialog(false)}>Cancel</Button>
          <Button onClick={handleGenerateReport} variant="contained" disabled={generatingReport}>
            {generatingReport ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanDetail;