import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Link as LinkIcon, BarChart } from '@mui/icons-material';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getTabValue = () => {
    if (currentPath === '/shorten') return 0;
    if (currentPath === '/statistics') return 1;
    return 0;
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs value={getTabValue()} aria-label="navigation tabs">
        <Tab
          icon={<LinkIcon />}
          label="URL Shortener"
          component={Link}
          to="/shorten"
          sx={{ textTransform: 'none' }}
        />
        <Tab
          icon={<BarChart />}
          label="Statistics"
          component={Link}
          to="/statistics"
          sx={{ textTransform: 'none' }}
        />
      </Tabs>
    </Box>
  );
};

export default Navigation;
