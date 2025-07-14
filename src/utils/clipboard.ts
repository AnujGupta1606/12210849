import { logger } from '../middleware/logger';

export const copyToClipboard = async (text: string, source: string = 'unknown'): Promise<boolean> => {
  try {
    // Modern clipboard API (works in HTTPS and secure contexts)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      await logger.Log('frontend', 'info', 'utils', `Text copied to clipboard via Clipboard API from ${source}`);
      return true;
    } 
    
    // Fallback method for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      await logger.Log('frontend', 'info', 'utils', `Text copied to clipboard via fallback method from ${source}`);
      return true;
    } else {
      throw new Error('execCommand copy failed');
    }
    
  } catch (error) {
    await logger.Log('frontend', 'error', 'utils', `Failed to copy text to clipboard from ${source}: ${error}`);
    return false;
  }
};

export const showCopyFeedback = (success: boolean, text: string) => {
  if (success) {
    // You can replace this with a toast notification or snackbar
    alert('Copied to clipboard!');
  } else {
    // Fallback: show the text for manual copying
    const userAction = window.confirm(
      `Could not copy automatically. Would you like to see the text to copy manually?\n\nText: ${text}`
    );
    if (userAction) {
      // Could open a modal or select the text for easy copying
      console.log('Text to copy:', text);
    }
  }
};
