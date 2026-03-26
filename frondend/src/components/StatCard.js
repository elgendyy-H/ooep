import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <Card sx={{ height: '100%', backgroundColor: 'rgba(26, 26, 26, 0.8)', backdropFilter: 'blur(5px)' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>{title}</Typography>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold">{value}</Typography>
        {trend && (
          <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;