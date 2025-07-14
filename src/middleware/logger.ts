export type StackType = 'frontend' | 'backend';
export type LevelType = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type PackageType = 
  | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style'
  | 'cache' | 'controller' | 'cron_job' | 'db' | 'domain' | 'handler' | 'repository' | 'route' | 'service'
  | 'auth' | 'config' | 'middleware' | 'utils';

export interface LogRequest {
  stack: StackType;
  level: LevelType;
  package: PackageType;
  message: string;
}

export interface LogResponse {
  logID: string;
  message: string;
}

export interface LogEntry {
  timestamp: string;
  stack: StackType;
  level: LevelType;
  package: PackageType;
  message: string;
  logID?: string;
  status: 'pending' | 'success' | 'failed';
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private testServerUrl = 'http://20.244.56.144/evaluation-service/logs';

  async Log(stack: StackType, level: LevelType, packageName: PackageType, message: string): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      stack,
      level,
      package: packageName,
      message,
      status: 'pending'
    };

    this.addLocalLog(logEntry);

    const consoleMessage = `[${logEntry.timestamp}] ${stack.toUpperCase()}:${packageName.toUpperCase()}:${level.toUpperCase()} - ${message}`;
    this.logToConsole(level, consoleMessage);

    try {
      const response = await this.sendToTestServer({
        stack,
        level,
        package: packageName,
        message
      });

      logEntry.logID = response.logID;
      logEntry.status = 'success';
      console.log(`✅ Log sent successfully - ID: ${response.logID}`);
    } catch (error) {
      logEntry.status = 'failed';
      console.error('❌ Failed to send log to server:', error);
      this.logToConsole('error', `Failed to send log to server: ${message}`);
    }
  }

  private async sendToTestServer(logRequest: LogRequest): Promise<LogResponse> {
    const response = await fetch(this.testServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logRequest)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  }

  private addLocalLog(logEntry: LogEntry): void {
    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private logToConsole(level: LevelType, message: string): void {
    switch (level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
      case 'fatal':
        console.error(message);
        break;
      default:
        console.log(message);
    }
  }

  async debug(packageName: PackageType, message: string, stack: StackType = 'frontend'): Promise<void> {
    await this.Log(stack, 'debug', packageName, message);
  }

  async info(packageName: PackageType, message: string, stack: StackType = 'frontend'): Promise<void> {
    await this.Log(stack, 'info', packageName, message);
  }

  async warn(packageName: PackageType, message: string, stack: StackType = 'frontend'): Promise<void> {
    await this.Log(stack, 'warn', packageName, message);
  }

  async error(packageName: PackageType, message: string, stack: StackType = 'frontend'): Promise<void> {
    await this.Log(stack, 'error', packageName, message);
  }

  async fatal(packageName: PackageType, message: string, stack: StackType = 'frontend'): Promise<void> {
    await this.Log(stack, 'fatal', packageName, message);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LevelType): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsByPackage(packageName: PackageType): LogEntry[] {
    return this.logs.filter(log => log.package === packageName);
  }

  clearLogs(): void {
    this.logs = [];
    this.Log('frontend', 'info', 'middleware', 'Local logs cleared');
  }
}

export const logger = new Logger();

export const logUserAction = async (action: string, data?: any) => {
  await logger.Log('frontend', 'info', 'component', `User Action: ${action}${data ? ` - ${JSON.stringify(data)}` : ''}`);
};

export const logApiCall = async (endpoint: string, method: string, data?: any) => {
  await logger.Log('frontend', 'info', 'api', `API Call: ${method} ${endpoint}${data ? ` - ${JSON.stringify(data)}` : ''}`);
};

export const logApiResponse = async (endpoint: string, status: number, data?: any) => {
  const level: LevelType = status >= 200 && status < 300 ? 'info' : status >= 400 && status < 500 ? 'warn' : 'error';
  await logger.Log('frontend', level, 'api', `API Response: ${endpoint} - ${status}${data ? ` - ${JSON.stringify(data)}` : ''}`);
};

export const logValidationError = async (field: string, error: string, data?: any) => {
  await logger.Log('frontend', 'warn', 'component', `Validation Error: ${field} - ${error}${data ? ` - ${JSON.stringify(data)}` : ''}`);
};
