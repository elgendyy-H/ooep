import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Error,
  Refresh,
} from '@mui/icons-material';
import api from '../services/api';

const FRAMEWORKS = ['iso27001', 'gdpr', 'pci_dss', 'hipaa'];

const Compliance = () => {
  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = (msg, severity) => setSnackbar({ open: true, message: msg, severity });

  // Fetch targets on mount
  React.useEffect(() => {
    const fetchTargets = async () => {
      try {
        const res = await api.get('/targets/');
        setTargets(res.data);
      } catch (err) {
        console.error('Error fetching targets:', err);
        showSnackbar('Failed to load targets', 'error');
      }
    };
    fetchTargets();
  }, []);

  const runComplianceCheck = async () => {
    if (!selectedTarget || !selectedFramework) {
      showSnackbar('Please select both target and framework', 'error');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/compliance/check', {
        framework: selectedFramework,
        targets: [selectedTarget],
      });
      setResults(response.data);
      showSnackbar('Compliance check completed', 'success');
    } catch (err) {
      console.error('Compliance check failed:', err);
      setError(err.response?.data?.detail || 'Failed to run compliance check');
      showSnackbar('Compliance check failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Typography variant="h4" fontWeight="bold" mb={3}>Compliance Management</Typography>

      <Grid container spacing={3}>
        {/* Control Panel */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Target</InputLabel>
                  <Select
                    value={selectedTarget}
                    label="Target"
                    onChange={e => setSelectedTarget(e.target.value)}
                  >
                    {targets.map(t => <MenuItem key={t.id} value={t.id}>{t.url}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Framework</InputLabel>
                  <Select
                    value={selectedFramework}
                    label="Framework"
                    onChange={e => setSelectedFramework(e.target.value)}
                  >
                    {FRAMEWORKS.map(f => <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  startIcon={<Security />}
                  onClick={runComplianceCheck}
                  disabled={loading || !selectedTarget || !selectedFramework}
                  fullWidth
                >
                  {loading ? 'Checking...' : 'Run Compliance Check'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Results */}
        {loading && <Grid item xs={12}><LinearProgress /></Grid>}

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {results && (
          <>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Compliance Score</Typography>
                  <Typography variant="h2" sx={{ color: getScoreColor(results.score) }}>
                    {results.score}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {results.passed} passed, {results.failed} failed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Framework: {results.framework.toUpperCase()}</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Control ID</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.details?.map(detail => (
                          <TableRow key={detail.control}>
                            <TableCell>{detail.control}</TableCell>
                            <TableCell>
                              <Chip
                                label={detail.status}
                                color={detail.status === 'passed' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default Compliance;