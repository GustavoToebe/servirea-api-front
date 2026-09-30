export {};

type TurnstileCallback = (token: string) => void;

declare global {
  interface Window {
    onTurnstileSuccessCallback?: TurnstileCallback;
    onTurnstileExpiredCallback?: () => void;
    turnstile?: {
      ready(callback: () => void): void;
      render(element: HTMLElement | string, options: {
        sitekey: string;
        callback?: TurnstileCallback;
        'expired-callback'?: () => void;
        'error-callback'?: (errorCode?: string) => void;
        theme?: 'light' | 'dark' | 'auto';
        appearance?: 'always' | 'execute' | 'interaction-only';
        retry?: 'auto' | 'never';
        size?: 'normal' | 'compact' | 'flexible';
      }): string;
      reset(widgetId?: string): void;
      remove(widgetId?: string): void;
    };
  }
}
