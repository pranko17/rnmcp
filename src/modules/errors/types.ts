export type ErrorSource = 'global' | 'promise';

export interface ErrorEntry {
  isFatal: boolean;
  message: string;
  source: ErrorSource;
  timestamp: string;
  stack?: string;
}

export interface ErrorsModuleOptions {
  maxEntries?: number;
}
