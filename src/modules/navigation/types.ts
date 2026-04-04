export interface NavigationRef {
  canGoBack: () => boolean;
  getCurrentRoute: () => unknown;
  getRootState: () => unknown;
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}
