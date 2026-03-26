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
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Snackbar,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Refresh,
  Download,
  Add,
  Visibility,
} from '@mui/icons-material';
import api from '../services/api';

const REPORT_FORMATS = ['html', 'pdf', 'json', 'csv'];

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedScans, setSelectedScans] = useState([]);
  const [reportFormat, setReportFormat] = useState('html');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [generating, setGenerating] = useState(false);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/'); // Assuming backend has GET /reports/
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      // If endpoint doesn't exist yet, we can use a mock or just show empty
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScans = useCallback(async () => {
    try {
      const response = await api.get('/scans/');
      setScans(response.data);
    } catch (err) {
      console.error('Error fetching scans:', err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchScans();
  }, [fetchReports, fetchScans]);

  const handleGenerateReport = async () => {
    if (selectedScans.length === 0) {
      showSnackbar('Please select at least one scan', 'error');
      return;
    }
    try {
      setGenerating(true);
      const response = await api.post('/reports/generate', {
        scan_ids: selectedScans,
        report_type: reportFormat,
        include_charts: includeCharts,
      });
      showSnackbar('Report generated successfully', 'success');
      setOpenDialog(false);
      setSelectedScans([]);
      fetchReports(); // refresh list
      // Optionally download immediately
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId, format) => {
    try {
      const response = await api.get(`/reports/${reportId}/download?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnackbar('Download started', 'success');
    } catch (err) {
      console.error('Error downloading report:', err);
      showSnackbar('Failed to download report', 'error');
    }
  };

  const toggleScanSelection = (scanId) => {
    setSelectedScans(prev =>
      prev.includes(scanId) ? prev.filter(id => id !== scanId) : [...prev, scanId]
    );
  };

  if (loading && reports.length === 0) {
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
        <Typography variant="h4" fontWeight="bold">Reports</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchReports}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Generate Report
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
              <TableCell>Scans</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Generated At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No reports generated yet. Click "Generate Report" to create one.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell>
                    {report.scan_ids?.join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Chip label={report.format} size="small" />
                  </TableCell>
                  <TableCell>{new Date(report.generated_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownload(report.id, report.format)}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Generate Report Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Select Scans to Include</Typography>
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedScans.length > 0 && selectedScans.length < scans.length}
                      checked={selectedScans.length === scans.length && scans.length > 0}
                      onChange={() => {
                        if (selectedScans.length === scans.length) {
                          setSelectedScans([]);
                        } else {
                          setSelectedScans(scans.map(s => s.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedScans.includes(scan.id)}
                        onChange={() => toggleScanSelection(scan.id)}
                      />
                    </TableCell>
                    <TableCell>#{scan.id}</TableCell>
                    <TableCell>{scan.target_url}</TableCell>
                    <TableCell>{scan.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <FormControl fullWidth margin="dense">
            <InputLabel>Report Format</InputLabel>
            <Select
              value={reportFormat}
              label="Report Format"
              onChange={(e) => setReportFormat(e.target.value)}
            >
              {REPORT_FORMATS.map(f => (
                <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Checkbox
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
            />
            <Typography variant="body2" component="span">Include charts and graphs</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={generating || selectedScans.length === 0}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;