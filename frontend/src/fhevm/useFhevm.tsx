"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FhevmInstance } from "./fhevmTypes";

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: any;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters;

  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, setStatus] = useState<FhevmGoState>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);

  // For static export, we'll return a mock instance
  useEffect(() => {
    if (enabled && provider) {
      setStatus("ready");
      // Create a mock FHEVM instance for static export
      const mockInstance: FhevmInstance = {
        createEncryptedInput: (contractAddress: string, userAddress: string) => ({
          add32: (value: number) => ({
            encrypt: () => Promise.resolve({
              handles: [`0x${Math.random().toString(16).substr(2, 64)}`],
              inputProof: `0x${Math.random().toString(16).substr(2, 512)}`
            })
          }),
          add64: (value: bigint) => ({
            encrypt: () => Promise.resolve({
              handles: [`0x${Math.random().toString(16).substr(2, 64)}`],
              inputProof: `0x${Math.random().toString(16).substr(2, 512)}`
            })
          })
        }),
        userDecrypt: () => Promise.resolve({}),
        generateKeypair: () => ({ privateKey: 'mock', publicKey: 'mock' }),
        createEIP712: () => ({}),
        publicDecrypt: () => ({}),
        getPublicKey: () => 'mock',
        getPublicParams: () => ({})
      };
      setInstance(mockInstance);
    }
  }, [enabled, provider]);

  const refresh = useCallback(() => {
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");
  }, []);

  return { instance, refresh, error, status };
}
