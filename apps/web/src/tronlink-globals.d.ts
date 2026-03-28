export {};

declare global {
  interface Window {
    tronLink?: {
      request: (args: { method: string }) => Promise<unknown>;
    };
    tronWeb?: {
      defaultAddress?: { base58?: string };
      ready?: boolean;
    };
  }
}
