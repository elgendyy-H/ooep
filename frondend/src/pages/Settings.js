import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Divider,
  Avatar,
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    username: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [preferences, setPreferences] = useState({
    dark_mode: true,
    email_notifications: true,
    auto_report: false,
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
    // Fetch user preferences from backend (if exists)
    const fetchPrefs = async () => {
      try {
        const res = await api.get('/users/preferences');
        setPreferences(res.data);
      } catch (err) {
        // ignore
      }
    };
    fetchPrefs();
  }, [user]);

  const showSnackbar = (msg, severity) => setSnackbar({ open: true, message: msg, severity });

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/users/me', profile);
      showSnackbar('Profile updated successfully', 'success');
    } catch (err) {
      console.error('Profile update failed:', err);
      showSnackbar('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      showSnackbar('Password changed successfully', 'success');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error('Password change failed:', err);
      showSnackbar(err.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/users/preferences', preferences);
      showSnackbar('Preferences saved', 'success');
    } catch (err) {
      console.error('Preferences update failed:', err);
      showSnackbar('Failed to save preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Typography variant="h4" fontWeight="bold" mb={3}>Settings</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: '#2196f3' }}>
                {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{profile.full_name}</Typography>
                <Typography variant="body2" color="textSecondary">{profile.email}</Typography>
              </Box>
            </Box>
            <TextField
              fullWidth margin="dense" label="Full Name" value={profile.full_name}
              onChange={e => setProfile({ ...profile, full_name: e.target.value })}
            />
            <TextField
              fullWidth margin="dense" label="Email" type="email" value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
            />
            <TextField
              fullWidth margin="dense" label="Username" disabled value={profile.username}
            />
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleProfileUpdate}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Update Profile
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Change Password</Typography>
            <TextField
              fullWidth margin="dense" label="Current Password" type="password"
              value={passwordData.current_password}
              onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
            />
            <TextField
              fullWidth margin="dense" label="New Password" type="password"
              value={passwordData.new_password}
              onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
            />
            <TextField
              fullWidth margin="dense" label="Confirm New Password" type="password"
              value={passwordData.confirm_password}
              onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
            />
            <Button
              variant="contained"
              startIcon={<Lock />}
              onClick={handlePasswordChange}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Preferences</Typography>
            <FormControlLabel
              control={<Switch checked={preferences.dark_mode} onChange={e => setPreferences({ ...preferences, dark_mode: e.target.checked })} />}
              label="Dark Mode"
            />
            <FormControlLabel
              control={<Switch checked={preferences.email_notifications} onChange={e => setPreferences({ ...preferences, email_notifications: e.target.checked })} />}
              label="Email Notifications"
            />
            <FormControlLabel
              control={<Switch checked={preferences.auto_report} onChange={e => setPreferences({ ...preferences, auto_report: e.target.checked })} />}
              label="Auto‑generate reports after scans"
            />
            <Button
              variant="contained"
              onClick={handlePreferencesUpdate}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Save Preferences
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="error">Danger Zone</Typography>
            <Divider sx={{ mb: 2 }} />
            <Button variant="outlined" color="error" onClick={logout}>
              Logout
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;