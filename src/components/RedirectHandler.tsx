import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { urlService } from '../services/urlService';
import { logger } from '../middleware/logger';

const RedirectHandler: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        setError('Invalid short code');
        setLoading(false);
        return;
      }

      logger.info('Attempting to redirect', { shortCode }, 'RedirectHandler');

      try {
        // Get URL data
        const urlData = await urlService.getUrlByShortCode(shortCode);
        
        if (!urlData) {
          setError('URL not found or has expired');
          setLoading(false);
          return;
        }

        // Record the click
        await urlService.recordClick(shortCode, 'direct');
        
        setRedirectUrl(urlData.originalUrl);
        
        // Redirect after a short delay to show the user what's happening
        setTimeout(() => {
          window.location.href = urlData.originalUrl;
        }, 2000);
        
        setLoading(false);
        
      } catch (error) {
        logger.error('Failed to handle redirect', error, 'RedirectHandler');
        setError('An error occurred while processing your request');
        setLoading(false);
      }
    };

    handleRedirect();
  }, [shortCode]);

  const handleManualRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 400,
          textAlign: 'center'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Redirecting you...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we redirect you to your destination
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1">
          The short URL you're looking for might have expired or doesn't exist.
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 400,
        textAlign: 'center'
      }}
    >
      <Typography variant="h5" gutterBottom color="success.main">
        Redirecting to:
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, wordBreak: 'break-all' }}>
        {redirectUrl}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        You will be redirected automatically in a moment...
      </Typography>
      <Button variant="contained" onClick={handleManualRedirect}>
        Click here if not redirected automatically
      </Button>
    </Box>
  );
};

export default RedirectHandler;
