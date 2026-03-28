export {};

declare global {
  interface Window {
    tronLink?: {
      ready?: boolean;
      tronWeb?: Window["tronWeb"];
      request: (args: { method: string }) => Promise<unknown>;
    };
    tronWeb?: {
      defaultAddress?: { base58?: string };
      ready?: boolean;
      transactionBuilder?: {
        sendTrx: (
          to: string,
          amountSun: number,
          from: string,
          options?: { feeLimit?: number }
        ) => Promise<unknown>;
      };
      trx?: {
        sign: (tx: unknown) => Promise<unknown>;
        sendRawTransaction: (tx: unknown) => Promise<unknown>;
      };
    };
  }
}
