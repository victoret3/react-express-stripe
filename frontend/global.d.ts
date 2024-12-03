export interface Ethereum {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  }
  
  declare global {
    interface Window {
      ethereum?: Ethereum;
    }
  }
  