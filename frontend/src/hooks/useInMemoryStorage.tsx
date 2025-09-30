"use client";

import { useRef } from "react";

export interface GenericStringStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function useInMemoryStorage(): { storage: GenericStringStorage } {
  const storageRef = useRef<Map<string, string>>(new Map());

  const storage: GenericStringStorage = {
    getItem(key: string): string | null {
      return storageRef.current.get(key) || null;
    },
    setItem(key: string, value: string): void {
      storageRef.current.set(key, value);
    },
    removeItem(key: string): void {
      storageRef.current.delete(key);
    },
  };

  return { storage };
}
