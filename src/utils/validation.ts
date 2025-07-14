import { ValidationError } from '../types/url.types';
import { logValidationError } from '../middleware/logger';

export const validateUrl = (url: string): ValidationError | null => {
  if (!url.trim()) {
    const error = { field: 'originalUrl', message: 'URL is required' };
    logValidationError(error.field, error.message, { url });
    return error;
  }

  // Check URL format
  try {
    const urlObj = new URL(url);
    
    // Check if protocol is http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      const error = { field: 'originalUrl', message: 'URL must start with http:// or https://' };
      logValidationError(error.field, error.message, { url });
      return error;
    }

    // Check if hostname exists
    if (!urlObj.hostname) {
      const error = { field: 'originalUrl', message: 'Invalid URL hostname' };
      logValidationError(error.field, error.message, { url });
      return error;
    }

    return null;
  } catch {
    const error = { field: 'originalUrl', message: 'Invalid URL format' };
    logValidationError(error.field, error.message, { url });
    return error;
  }
};

export const validateShortCode = (shortCode: string): ValidationError | null => {
  if (!shortCode) {
    return null; // Optional field
  }

  if (shortCode.length < 3) {
    const error = { field: 'customShortCode', message: 'Short code must be at least 3 characters long' };
    logValidationError(error.field, error.message, { shortCode });
    return error;
  }

  if (shortCode.length > 15) {
    const error = { field: 'customShortCode', message: 'Short code must be no more than 15 characters long' };
    logValidationError(error.field, error.message, { shortCode });
    return error;
  }

  // Check if alphanumeric
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(shortCode)) {
    const error = { field: 'customShortCode', message: 'Short code must contain only letters and numbers' };
    logValidationError(error.field, error.message, { shortCode });
    return error;
  }

  return null;
};

export const validateValidityMinutes = (validity: string): ValidationError | null => {
  if (!validity) {
    return null; // Optional field, will default to 30 minutes
  }

  const validityNum = parseInt(validity, 10);
  
  if (isNaN(validityNum)) {
    const error = { field: 'validityMinutes', message: 'Validity must be a number' };
    logValidationError(error.field, error.message, { validity });
    return error;
  }

  if (validityNum < 1) {
    const error = { field: 'validityMinutes', message: 'Validity must be at least 1 minute' };
    logValidationError(error.field, error.message, { validity });
    return error;
  }

  if (validityNum > 525600) { // 1 year in minutes
    const error = { field: 'validityMinutes', message: 'Validity cannot exceed 1 year (525600 minutes)' };
    logValidationError(error.field, error.message, { validity });
    return error;
  }

  return null;
};

export const validateAllFields = (originalUrl: string, customShortCode: string, validityMinutes: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  const urlError = validateUrl(originalUrl);
  if (urlError) errors.push(urlError);

  const shortCodeError = validateShortCode(customShortCode);
  if (shortCodeError) errors.push(shortCodeError);

  const validityError = validateValidityMinutes(validityMinutes);
  if (validityError) errors.push(validityError);

  return errors;
};
