// Logging Middleware - Mandatory as per requirements
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG';
  message: string;
  data?: any;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  info(message: string, data?: any, source?: string): void {
    this.addLog('INFO', message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.addLog('ERROR', message, data, source);
  }

  warning(message: string, data?: any, source?: string): void {
    this.addLog('WARNING', message, data, source);
  }

  debug(message: string, data?: any, source?: string): void {
    this.addLog('DEBUG', message, data, source);
  }

  private addLog(level: LogEntry['level'], message: string, data?: any, source?: string): void {
    const logEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
      source
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for development
    const consoleMessage = `[${logEntry.timestamp}] ${level}: ${message}`;
    if (data) {
      console.log(consoleMessage, data);
    } else {
      console.log(consoleMessage);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', undefined, 'Logger');
  }
}

// Export singleton instance
export const logger = new Logger();

// Middleware function for API calls
export const logApiCall = (endpoint: string, method: string, data?: any) => {
  logger.info(`API Call: ${method} ${endpoint}`, data, 'API');
};

export const logApiResponse = (endpoint: string, status: number, data?: any) => {
  if (status >= 200 && status < 300) {
    logger.info(`API Response: ${endpoint} - ${status}`, data, 'API');
  } else {
    logger.error(`API Error: ${endpoint} - ${status}`, data, 'API');
  }
};

export const logUserAction = (action: string, data?: any) => {
  logger.info(`User Action: ${action}`, data, 'USER');
};

export const logValidationError = (field: string, error: string, data?: any) => {
  logger.warning(`Validation Error: ${field} - ${error}`, data, 'VALIDATION');
};
