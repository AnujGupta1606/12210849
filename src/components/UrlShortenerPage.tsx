import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Chip,
  Link,
  Stack
} from '@mui/material';
import { urlService } from '../services/urlService';
import { UrlData } from '../types/url.types';
import { logUserAction } from '../middleware/logger';

const UrlShortenerPage: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customShortCode, setCustomShortCode] = useState('');
  const [validityMinutes, setValidityMinutes] = useState('');
  const [result, setResult] = useState<UrlData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    logUserAction('URL_SHORTENING_ATTEMPT', { 
      originalUrl: originalUrl.slice(0, 50) + '...', 
      hasCustomCode: !!customShortCode.trim(),
      validityMinutes: validityMinutes ? parseInt(validityMinutes) : 30
    });

    setLoading(true);
    setError('');
    setResult(null);

    // Basic validation
    if (!originalUrl.trim()) {
      logUserAction('URL_SHORTENING_FAILED', { reason: 'Empty URL' });
      setError('Please enter a URL');
      setLoading(false);
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      logUserAction('URL_SHORTENING_FAILED', { reason: 'Invalid URL format' });
      setError('Please enter a valid URL');
      setLoading(false);
      return;
    }

    // Create URL
    const response = await urlService.createUrl({
      originalUrl: originalUrl.trim(),
      customShortCode: customShortCode.trim() || undefined,
      validityMinutes: validityMinutes ? parseInt(validityMinutes) : undefined
    });

    if (response.success && response.data) {
      logUserAction('URL_SHORTENING_SUCCESS', { 
        shortCode: response.data.shortCode,
        expiresAt: response.data.expiresAt 
      });
      setResult(response.data);
      // Clear form
      setOriginalUrl('');
      setCustomShortCode('');
      setValidityMinutes('');
    } else {
      logUserAction('URL_SHORTENING_FAILED', { 
        reason: response.error || 'Unknown error' 
      });
      setError(response.error || 'Failed to create short URL');
    }

    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
    alert('Copied to clipboard!');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        URL Shortener
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Enter a URL to create a short link
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Enter URL to shorten"
              placeholder="https://example.com"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                sx={{ flex: 1 }}
                label="Custom Short Code (optional)"
                placeholder="mylink"
                value={customShortCode}
                onChange={(e) => setCustomShortCode(e.target.value)}
              />
              
              <TextField
                sx={{ flex: 1 }}
                label="Validity (minutes)"
                placeholder="30"
                type="number"
                value={validityMinutes}
                onChange={(e) => setValidityMinutes(e.target.value)}
              />
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Creating...' : 'Create Short URL'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              Short URL Created!
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Original URL:
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {result.originalUrl}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Short URL:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Link
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontWeight: 'bold', flex: 1 }}
                >
                  {result.shortUrl}
                </Link>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleCopy(result.shortUrl)}
                >
                  Copy
                </Button>
              </Box>
            </Box>
            
            <Box>
              <Chip
                label={`Expires: ${result.expiresAt.toLocaleString()}`}
                size="small"
                color="info"
              />
              {result.isCustom && (
                <Chip
                  label="Custom Code"
                  size="small"
                  color="secondary"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UrlShortenerPage;
