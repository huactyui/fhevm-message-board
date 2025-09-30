"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface MetaMaskProviderState {
  provider: any;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => void;
}

const MetaMaskContext = createContext<MetaMaskProviderState | undefined>(undefined);

export function useMetaMask(): MetaMaskProviderState {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
}

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<any>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(11155111); // Sepolia
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const connect = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setAccounts(accounts);
        setIsConnected(true);
        setProvider((window as any).ethereum);
      } else {
        throw new Error("MetaMask not found");
      }
    } catch (err) {
      setError(err as Error);
    }
  };

  return (
    <MetaMaskContext.Provider
      value={{
        provider,
        chainId,
        accounts,
        isConnected,
        error,
        connect,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}
