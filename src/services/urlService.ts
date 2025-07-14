import { UrlData, CreateUrlRequest, CreateUrlResponse, ClickData } from '../types/url.types';
import { logApiCall, logApiResponse } from '../middleware/logger';
import { logger } from '../middleware/logger';

class UrlService {
  private urls: Map<string, UrlData> = new Map();
  private urlsByShortCode: Map<string, string> = new Map();

  constructor() {
    this.loadFromStorage();
    logger.Log('frontend', 'info', 'service', 'URL Service initialized');
  }

  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateUniqueShortCode(): string {
    let shortCode: string;
    do {
      shortCode = this.generateShortCode();
    } while (this.urlsByShortCode.has(shortCode));
    return shortCode;
  }

  private saveToStorage(): void {
    try {
      const urlsArray = Array.from(this.urls.values());
      localStorage.setItem('urlShortener_urls', JSON.stringify(urlsArray));
    } catch (error) {
      console.error('Failed to save URLs');
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('urlShortener_urls');
      if (stored) {
        const urlsArray: UrlData[] = JSON.parse(stored);
        urlsArray.forEach(urlData => {
          urlData.createdAt = new Date(urlData.createdAt);
          urlData.expiresAt = new Date(urlData.expiresAt);
          urlData.clicks = urlData.clicks.map(click => ({
            ...click,
            timestamp: new Date(click.timestamp)
          }));
          
          this.urls.set(urlData.id, urlData);
          this.urlsByShortCode.set(urlData.shortCode, urlData.id);
        });
      }
    } catch (error) {
      console.error('Failed to load URLs');
    }
  }

  async createUrl(request: CreateUrlRequest): Promise<CreateUrlResponse> {
    logApiCall('/api/url/create', 'POST', { 
      originalUrl: request.originalUrl.slice(0, 50) + '...', 
      hasCustomCode: !!request.customShortCode,
      validityMinutes: request.validityMinutes || 30
    });

    try {
     
      try {
        new URL(request.originalUrl);
      } catch {
        const errorResponse = { success: false, error: 'Invalid URL format' };
        logApiResponse('/api/url/create', 400, errorResponse);
        return errorResponse;
      }

   
      let shortCode: string;
      if (request.customShortCode) {
        if (request.customShortCode.length < 3 || request.customShortCode.length > 15) {
          const errorResponse = { success: false, error: 'Short code must be 3-15 characters' };
          logApiResponse('/api/url/create', 400, errorResponse);
          return errorResponse;
        }
        
        if (!/^[a-zA-Z0-9]+$/.test(request.customShortCode)) {
          const errorResponse = { success: false, error: 'Short code must be alphanumeric' };
          logApiResponse('/api/url/create', 400, errorResponse);
          return errorResponse;
        }
        
        if (this.urlsByShortCode.has(request.customShortCode)) {
          const errorResponse = { success: false, error: 'Short code already exists' };
          logApiResponse('/api/url/create', 409, errorResponse);
          return errorResponse;
        }
        
        shortCode = request.customShortCode;
      } else {
        shortCode = this.generateUniqueShortCode();
      }

     
      const validityMinutes = request.validityMinutes || 30;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + validityMinutes * 60000);

   
      const urlData: UrlData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        originalUrl: request.originalUrl,
        shortCode,
        shortUrl: `http://localhost:3000/${shortCode}`,
        createdAt: now,
        expiresAt,
        isCustom: !!request.customShortCode,
        clicks: []
      };

   
      this.urls.set(urlData.id, urlData);
      this.urlsByShortCode.set(shortCode, urlData.id);
      this.saveToStorage();
      
      logger.Log('frontend', 'info', 'service', `URL shortened: ${shortCode}`);
      
      logApiResponse('/api/url/create', 201, { 
        shortCode: urlData.shortCode, 
        expiresAt: urlData.expiresAt 
      });
      
      return { success: true, data: urlData };
    } catch (error) {
      const errorResponse = { success: false, error: 'Failed to create short URL' };
      logApiResponse('/api/url/create', 500, { error });
      return errorResponse;
    }
  }

  async getUrlByShortCode(shortCode: string): Promise<UrlData | null> {
   
    logApiCall(`/api/url/${shortCode}`, 'GET', { shortCode });
    
    try {
      const urlId = this.urlsByShortCode.get(shortCode);
      if (!urlId) {
        logApiResponse(`/api/url/${shortCode}`, 404, { error: 'URL not found' });
        return null;
      }

      const urlData = this.urls.get(urlId);
      if (!urlData) {
        logApiResponse(`/api/url/${shortCode}`, 404, { error: 'URL data not found' });
        return null;
      }

      
      if (new Date() > urlData.expiresAt) {
        logApiResponse(`/api/url/${shortCode}`, 410, { error: 'URL expired' });
        return null;
      }

      logApiResponse(`/api/url/${shortCode}`, 200, { 
        shortCode: urlData.shortCode,
        originalUrl: urlData.originalUrl.slice(0, 50) + '...'
      });
      return urlData;
    } catch (error) {
      logApiResponse(`/api/url/${shortCode}`, 500, { error });
      return null;
    }
  }

  async recordClick(shortCode: string, source: string = 'direct'): Promise<boolean> {
 
    logApiCall(`/api/url/${shortCode}/click`, 'POST', { shortCode, source });
    
    try {
      const urlId = this.urlsByShortCode.get(shortCode);
      if (!urlId) {
        logApiResponse(`/api/url/${shortCode}/click`, 404, { error: 'URL not found' });
        return false;
      }

      const urlData = this.urls.get(urlId);
      if (!urlData) {
        logApiResponse(`/api/url/${shortCode}/click`, 404, { error: 'URL data not found' });
        return false;
      }

     
      if (new Date() > urlData.expiresAt) {
        logApiResponse(`/api/url/${shortCode}/click`, 410, { error: 'URL expired' });
        return false;
      }

      
      const clickData: ClickData = {
        id: Date.now().toString(),
        timestamp: new Date(),
        source,
        location: 'Local',
        userAgent: navigator.userAgent || 'Unknown'
      };

      urlData.clicks.push(clickData);
      this.saveToStorage();
      
 
      logApiResponse(`/api/url/${shortCode}/click`, 200, { 
        clickId: clickData.id,
        totalClicks: urlData.clicks.length 
      });
      
      return true;
    } catch (error) {
      logApiResponse(`/api/url/${shortCode}/click`, 500, { error });
      return false;
    }
  }

  getAllUrls(): UrlData[] {
    try {
      return Array.from(this.urls.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      return [];
    }
  }
}

export const urlService = new UrlService();
