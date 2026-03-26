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
  Alert,
  Snackbar,
  LinearProgress,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Search,
  PlayArrow,
  Close,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Targets = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [scanningId, setScanningId] = useState(null);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchTargets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/targets/');
      setTargets(response.data);
    } catch (err) {
      console.error('Error fetching targets:', err);
      setError(err.response?.data?.detail || 'Failed to load targets');
      showSnackbar('Failed to load targets', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const openCreateDialog = () => {
    setEditingTarget(null);
    setFormData({ url: '', name: '', description: '' });
    setOpenDialog(true);
  };

  const openEditDialog = (target) => {
    setEditingTarget(target);
    setFormData({
      url: target.url,
      name: target.name,
      description: target.description || '',
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingTarget(null);
    setFormData({ url: '', name: '', description: '' });
  };

  const handleSubmit = async () => {
    if (!formData.url || !formData.name) {
      showSnackbar('URL and name are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingTarget) {
        // Update existing target
        await api.put(`/targets/${editingTarget.id}`, formData);
        showSnackbar('Target updated successfully', 'success');
      } else {
        // Create new target
        await api.post('/targets/', formData);
        showSnackbar('Target created successfully', 'success');
      }
      handleDialogClose();
      fetchTargets(); // Refresh list
    } catch (err) {
      console.error('Error saving target:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to save target', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm('Are you sure you want to delete this target?')) return;
    try {
      await api.delete(`/targets/${targetId}`);
      showSnackbar('Target deleted', 'success');
      fetchTargets();
    } catch (err) {
      console.error('Error deleting target:', err);
      showSnackbar('Failed to delete target', 'error');
    }
  };

  const handleScanNow = async (target) => {
    try {
      setScanningId(target.id);
      // Create a new scan for this target
      const response = await api.post('/scans/', {
        target_url: target.url,
        scan_type: 'quick',
      });
      showSnackbar('Scan created and started', 'success');
      // Navigate to scan details page
      navigate(`/scans/${response.data.id}`);
    } catch (err) {
      console.error('Error starting scan:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to start scan', 'error');
    } finally {
      setScanningId(null);
    }
  };

  const filteredTargets = targets.filter(target =>
    target.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    target.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && targets.length === 0) {
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
        <Typography variant="h4" fontWeight="bold">Targets</Typography>
        <Box display="flex" gap={2}>
          <TextField
            size="small"
            placeholder="Search targets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Close />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchTargets}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add Target
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
              <TableCell>Name</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTargets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No targets found. Click "Add Target" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredTargets.map((target) => (
                <TableRow key={target.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {target.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={target.url}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{target.description || '—'}</TableCell>
                  <TableCell>{new Date(target.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="Scan Now">
                      <IconButton
                        onClick={() => handleScanNow(target)}
                        disabled={scanningId === target.id}
                        color="primary"
                      >
                        <PlayArrow />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => openEditDialog(target)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteTarget(target.id)} color="error">
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTarget ? 'Edit Target' : 'Add New Target'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Target URL"
            type="url"
            fullWidth
            variant="outlined"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
            sx={{ mb: 2 }}
            helperText="e.g., https://example.com"
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : (editingTarget ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Targets;