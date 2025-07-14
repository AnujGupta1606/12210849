export interface UrlData {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: Date;
  expiresAt: Date;
  isCustom: boolean;
  clicks: ClickData[];
}

export interface ClickData {
  id: string;
  timestamp: Date;
  source: string;
  location: string;
  userAgent: string;
}

export interface CreateUrlRequest {
  originalUrl: string;
  customShortCode?: string;
  validityMinutes?: number;
}

export interface CreateUrlResponse {
  success: boolean;
  data?: UrlData;
  error?: string;
}

export interface UrlFormData {
  originalUrl: string;
  customShortCode: string;
  validityMinutes: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface UrlStats {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  expiredUrls: number;
}
