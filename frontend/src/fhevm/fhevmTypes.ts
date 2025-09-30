// Simplified FHEVM types for static export compatibility
export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): {
    add32(value: number): { encrypt(): Promise<{ handles: string[]; inputProof: string }> };
    add64(value: bigint): { encrypt(): Promise<{ handles: string[]; inputProof: string }> };
  };
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, any>>;
  generateKeypair(): { privateKey: string; publicKey: string };
  createEIP712(): any;
  publicDecrypt(): any;
  getPublicKey(): string;
  getPublicParams(): any;
}

export interface FhevmWindowType extends Window {
  relayerSDK: any;
}

export interface FhevmInitSDKOptions {
  networkUrl?: string;
}

export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;
export type FhevmLoadSDKType = () => Promise<void>;
