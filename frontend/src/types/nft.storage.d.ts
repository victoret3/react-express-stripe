declare module 'nft.storage' {
  export class NFTStorage {
    constructor(config: { token: string });
    store(metadata: { name: string; description: string; image: File }): Promise<{ ipnft: string }>;
    storeBlob(file: File | Blob): Promise<string>;
  }
} 