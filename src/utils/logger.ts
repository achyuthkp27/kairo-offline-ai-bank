/**
 * Kairo — lightweight app logger
 * Keeps noisy logs out of production while preserving warnings/errors.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLogDebug = __DEV__;

const write = (level: LogLevel, message: string, ...args: unknown[]) => {
  if ((level === 'debug' || level === 'info') && !shouldLogDebug) return;
  const prefix = `[Kairo:${level.toUpperCase()}]`;

  switch (level) {
    case 'debug':
    case 'info':
      console.log(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'error':
      console.error(prefix, message, ...args);
      break;
  }
};

export const logger = {
  debug: (message: string, ...args: unknown[]) => write('debug', message, ...args),
  info: (message: string, ...args: unknown[]) => write('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => write('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => write('error', message, ...args),
};
