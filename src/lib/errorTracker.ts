import { Platform } from 'react-native';

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  component?: string;
  userEmail?: string;
  userName?: string;
}

const STORAGE_KEY = 'hydrax-error-logs';

export const errorTracker = {
  /**
   * Log an error to storage
   */
  logError: (message: string, stack?: string, component?: string) => {
    try {
      if (Platform.OS !== 'web') {
        console.warn('Error logged (non-web):', message, stack);
        return;
      }

      let userEmail = 'anonymous';
      let userName = 'anonymous';

      // Safe parse of auth store
      try {
        const authDataStr = localStorage.getItem('hydrax-auth-storage') || localStorage.getItem('auth-storage');
        if (authDataStr) {
          const parsed = JSON.parse(authDataStr);
          if (parsed && parsed.state && parsed.state.user) {
            userEmail = parsed.state.user.email || 'anonymous';
            userName = parsed.state.user.name || 'anonymous';
          }
        }
      } catch (e) {
        // Ignore parsing errors for auth info
      }

      const newLog: ErrorLog = {
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        message,
        stack,
        component,
        userEmail,
        userName
      };

      const existingLogsStr = localStorage.getItem(STORAGE_KEY);
      const existingLogs: ErrorLog[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      
      // Keep only last 100 errors to prevent storage bloating
      existingLogs.unshift(newLog);
      if (existingLogs.length > 100) {
        existingLogs.pop();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLogs));
      
      // Trigger a custom event so the Admin Console can auto-refresh
      window.dispatchEvent(new CustomEvent('hydrax-new-error-logged'));
    } catch (err) {
      console.error('Failed to save error log in local storage:', err);
    }
  },

  /**
   * Get all stored error logs
   */
  getErrorLogs: (): ErrorLog[] => {
    if (Platform.OS !== 'web') return [];
    try {
      const logsStr = localStorage.getItem(STORAGE_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Clear all error logs
   */
  clearErrorLogs: () => {
    if (Platform.OS !== 'web') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('hydrax-new-error-logged'));
    } catch (err) {
      console.error('Failed to clear error logs:', err);
    }
  },

  /**
   * Setup global web error interceptors
   */
  initGlobalInterceptors: () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Handle normal runtime errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMsg = typeof message === 'string' ? message : (message?.toString() || 'Unknown runtime error');
      const stack = error?.stack || `at ${source || 'unknown'}:${lineno || 0}:${colno || 0}`;
      errorTracker.logError(errorMsg, stack, 'GlobalWindow');
      
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false; // let browser handle it too
    };

    // Handle promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let errorMsg = 'Unhandled Promise Rejection';
      let stack = '';

      if (reason) {
        if (reason instanceof Error) {
          errorMsg = reason.message;
          stack = reason.stack || '';
        } else if (typeof reason === 'string') {
          errorMsg = reason;
        } else {
          try {
            errorMsg = JSON.stringify(reason);
          } catch (e) {
            errorMsg = 'Object rejection';
          }
        }
      }

      errorTracker.logError(errorMsg, stack, 'GlobalPromiseRejection');
    });
  }
};
