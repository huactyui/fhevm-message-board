"use client";

import { ethers } from "ethers";
import { useMetaMask } from "./useMetaMaskProvider";
import { RefObject, useRef, useState, useEffect } from "react";

export interface UseMetaMaskEthersSignerState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => void;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
  ethersBrowserProvider: ethers.BrowserProvider | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  initialMockChains: Readonly<Record<number, string>> | undefined;
}

export function useMetaMaskEthersSignerInternal(parameters: { initialMockChains?: Readonly<Record<number, string>> }): UseMetaMaskEthersSignerState {
  const { initialMockChains } = parameters;
  const { provider, chainId, accounts, isConnected, connect, error } = useMetaMask();

  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersBrowserProvider, setEthersBrowserProvider] = useState<ethers.BrowserProvider | undefined>(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<ethers.ContractRunner | undefined>(undefined);

  const chainIdRef = useRef<number | undefined>(chainId);
  const ethersSignerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);

  const sameChain = useRef((chainId: number | undefined) => {
    return chainId === chainIdRef.current;
  });

  const sameSigner = useRef((signer: ethers.JsonRpcSigner | undefined) => {
    return signer === ethersSignerRef.current;
  });

  useEffect(() => {
    if (provider && isConnected) {
      const browserProvider = new ethers.BrowserProvider(provider);
      setEthersBrowserProvider(browserProvider);
      setEthersReadonlyProvider(browserProvider);

      browserProvider.getSigner().then(signer => {
        setEthersSigner(signer);
        ethersSignerRef.current = signer;
      });
    }
  }, [provider, isConnected]);

  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    error,
    connect,
    sameChain,
    sameSigner,
    ethersBrowserProvider,
    ethersReadonlyProvider,
    ethersSigner,
    initialMockChains,
  };
}

export function MetaMaskEthersSignerProvider({ children, initialMockChains }: { children: React.ReactNode; initialMockChains?: Readonly<Record<number, string>> }) {
  const value = useMetaMaskEthersSignerInternal({ initialMockChains });
  return <>{children}</>;
}
