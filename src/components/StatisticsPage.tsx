import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Link,
  Chip
} from '@mui/material';
import { urlService } from '../services/urlService';
import { UrlData } from '../types/url.types';

const StatisticsPage: React.FC = () => {
  const [urls, setUrls] = useState<UrlData[]>([]);

  useEffect(() => {
    const allUrls = urlService.getAllUrls();
    setUrls(allUrls);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {

      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
    alert('Copied to clipboard!');
  };

  const isExpired = (expiresAt: Date) => new Date() > expiresAt;
  const activeUrls = urls.filter(url => !isExpired(url.expiresAt));
  const totalClicks = urls.reduce((sum, url) => sum + url.clicks.length, 0);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Statistics
      </Typography>
      
   
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h4" color="primary">{urls.length}</Typography>
            <Typography variant="body2">Total URLs</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h4" color="success.main">{activeUrls.length}</Typography>
            <Typography variant="body2">Active URLs</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h4" color="info.main">{totalClicks}</Typography>
            <Typography variant="body2">Total Clicks</Typography>
          </CardContent>
        </Card>
      </Stack>

      {urls.length === 0 ? (
        <Alert severity="info">
          No URLs created yet. Go to URL Shortener to create some!
        </Alert>
      ) : (
        <Stack spacing={2}>
          {urls.map((url) => (
            <Card key={url.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    <Link href={url.shortUrl} target="_blank" rel="noopener noreferrer">
                      {url.shortUrl}
                    </Link>
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                      color={isExpired(url.expiresAt) ? 'error' : 'success'}
                      size="small"
                    />
                    <Chip
                      label={`${url.clicks.length} clicks`}
                      color="info"
                      size="small"
                    />
                  </Stack>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Original: {url.originalUrl}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Created: {url.createdAt.toLocaleString()} | 
                  Expires: {url.expiresAt.toLocaleString()}
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleCopy(url.shortUrl)}
                >
                  Copy URL
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default StatisticsPage;
