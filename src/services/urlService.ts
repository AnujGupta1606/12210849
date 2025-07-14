import { UrlData, CreateUrlRequest, CreateUrlResponse, ClickData } from '../types/url.types';

class UrlService {
  private urls: Map<string, UrlData> = new Map();
  private urlsByShortCode: Map<string, string> = new Map();

  constructor() {
    this.loadFromStorage();
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
    try {
      // Basic URL validation
      try {
        new URL(request.originalUrl);
      } catch {
        return { success: false, error: 'Invalid URL format' };
      }

      // Check custom short code
      let shortCode: string;
      if (request.customShortCode) {
        if (request.customShortCode.length < 3 || request.customShortCode.length > 15) {
          return { success: false, error: 'Short code must be 3-15 characters' };
        }
        
        if (!/^[a-zA-Z0-9]+$/.test(request.customShortCode)) {
          return { success: false, error: 'Short code must be alphanumeric' };
        }
        
        if (this.urlsByShortCode.has(request.customShortCode)) {
          return { success: false, error: 'Short code already exists' };
        }
        
        shortCode = request.customShortCode;
      } else {
        shortCode = this.generateUniqueShortCode();
      }

      // Set validity
      const validityMinutes = request.validityMinutes || 30;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + validityMinutes * 60000);

      // Create URL data
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

      // Store
      this.urls.set(urlData.id, urlData);
      this.urlsByShortCode.set(shortCode, urlData.id);
      this.saveToStorage();
      
      return { success: true, data: urlData };
    } catch (error) {
      return { success: false, error: 'Failed to create short URL' };
    }
  }

  async getUrlByShortCode(shortCode: string): Promise<UrlData | null> {
    try {
      const urlId = this.urlsByShortCode.get(shortCode);
      if (!urlId) return null;

      const urlData = this.urls.get(urlId);
      if (!urlData) return null;

      // Check if expired
      if (new Date() > urlData.expiresAt) return null;

      return urlData;
    } catch (error) {
      return null;
    }
  }

  async recordClick(shortCode: string, source: string = 'direct'): Promise<boolean> {
    try {
      const urlId = this.urlsByShortCode.get(shortCode);
      if (!urlId) return false;

      const urlData = this.urls.get(urlId);
      if (!urlData) return false;

      // Check if expired
      if (new Date() > urlData.expiresAt) return false;

      // Record click
      const clickData: ClickData = {
        id: Date.now().toString(),
        timestamp: new Date(),
        source,
        location: 'Local',
        userAgent: navigator.userAgent || 'Unknown'
      };

      urlData.clicks.push(clickData);
      this.saveToStorage();
      
      return true;
    } catch (error) {
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
