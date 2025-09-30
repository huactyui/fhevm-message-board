"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { MessageBoardABI } from "@/abi/MessageBoardABI";
import { MessageBoardAddresses } from "@/abi/MessageBoardAddresses";

export type Message = {
  id: bigint;
  author: string;
  content: string;
  timestamp: bigint;
  isEncrypted: boolean;
  encryptedRating: string;
};

type MessageBoardInfoType = {
  abi: typeof MessageBoardABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getMessageBoardByChainId(
  chainId: number | undefined
): MessageBoardInfoType {
  if (!chainId) {
    return { abi: MessageBoardABI.abi };
  }

  const entry =
    MessageBoardAddresses[chainId.toString() as keyof typeof MessageBoardAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: MessageBoardABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: MessageBoardABI.abi,
  };
}

export const useMessageBoard = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCount, setMessageCount] = useState<bigint>(0n);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isPostingMessage, setIsPostingMessage] = useState<boolean>(false);
  const [isRatingMessage, setIsRatingMessage] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const messageBoardRef = useRef<MessageBoardInfoType | undefined>(undefined);
  const messageCountRef = useRef<bigint>(0n);
  const isLoadingMessagesRef = useRef<boolean>(isLoadingMessages);
  const isPostingMessageRef = useRef<boolean>(isPostingMessage);
  const isRatingMessageRef = useRef<boolean>(isRatingMessage);

  const messageBoard = useMemo(() => {
    const c = getMessageBoardByChainId(chainId);
    messageBoardRef.current = c;
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!messageBoard) {
      return undefined;
    }
    return Boolean(messageBoard.address) && messageBoard.address !== ethers.ZeroAddress;
  }, [messageBoard]);

  const canLoadMessages = useMemo(() => {
    return messageBoard.address && ethersReadonlyProvider && !isLoadingMessages;
  }, [messageBoard.address, ethersReadonlyProvider, isLoadingMessages]);

  const canPostMessage = useMemo(() => {
    return messageBoard.address && ethersSigner && !isPostingMessage;
  }, [messageBoard.address, ethersSigner, isPostingMessage]);

  const canRateMessage = useMemo(() => {
    return messageBoard.address && instance && ethersSigner && !isRatingMessage;
  }, [messageBoard.address, instance, ethersSigner, isRatingMessage]);

  const hasMoreMessages = useMemo(() => {
    return messages.length < Number(messageCount);
  }, [messages.length, messageCount]);

  const loadMessageCount = useCallback(async () => {
    if (!messageBoard.address || !ethersReadonlyProvider) {
      return Promise.resolve();
    }

    try {
      const contract = new ethers.Contract(
        messageBoard.address,
        messageBoard.abi,
        ethersReadonlyProvider
      );

      const count = await contract.getMessageCount();
      setMessageCount(count);
      messageCountRef.current = count;
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to load message count:", error);
      setMessage(`Failed to load message count: ${error}`);
      return Promise.reject(error);
    }
  }, [messageBoard.address, messageBoard.abi, ethersReadonlyProvider]);

  const loadMessages = useCallback(async (startIndex: number = 0, count: number = 10) => {
    if (isLoadingMessagesRef.current) {
      return;
    }

    if (!messageBoard.address || !ethersReadonlyProvider) {
      return;
    }

    if (Number(messageCount) > 0 && startIndex >= Number(messageCount)) {
      setMessage("All messages loaded");
      return;
    }

    isLoadingMessagesRef.current = true;
    setIsLoadingMessages(true);
    setMessage("Loading messages...");

    try {
      const contract = new ethers.Contract(
        messageBoard.address,
        messageBoard.abi,
        ethersReadonlyProvider
      );

      const result = await contract.getMessages(startIndex, count);

      const loadedMessages: Message[] = [];
      for (let i = 0; i < result[0].length; i++) {
        loadedMessages.push({
          id: result[0][i],
          author: result[1][i],
          content: result[2][i],
          timestamp: result[3][i],
          isEncrypted: result[4][i],
          encryptedRating: result[5][i],
        });
      }

      if (startIndex === 0) {
        setMessages(loadedMessages);
      } else {
        setMessages(prev => [...prev, ...loadedMessages]);
      }

      setMessage(`Loaded ${loadedMessages.length} messages`);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessage(`Failed to load messages: ${error}`);
    } finally {
      isLoadingMessagesRef.current = false;
      setIsLoadingMessages(false);
    }
  }, [messageBoard.address, messageBoard.abi, ethersReadonlyProvider, messageCount]);

  const postMessage = useCallback(async (content: string, isEncrypted: boolean = false) => {
    if (isPostingMessageRef.current) {
      return;
    }

    if (!messageBoard.address || !ethersSigner) {
      return;
    }

    if (!content.trim()) {
      setMessage("Message content cannot be empty");
      return;
    }

    isPostingMessageRef.current = true;
    setIsPostingMessage(true);
    setMessage("Posting message...");

    try {
      const contract = new ethers.Contract(
        messageBoard.address,
        messageBoard.abi,
        ethersSigner
      );

      let tx: ethers.TransactionResponse;
      if (isEncrypted) {
        tx = await contract.postEncryptedMessage(content);
      } else {
        tx = await contract.postMessage(content);
      }

      setMessage("Message posted successfully!");
      await loadMessageCount();
      await loadMessages(0, 100);
    } catch (error) {
      console.error("Failed to post message:", error);
      setMessage(`Failed to post message: ${error}`);
    } finally {
      isPostingMessageRef.current = false;
      setIsPostingMessage(false);
    }
  }, [messageBoard.address, messageBoard.abi, ethersSigner, loadMessageCount, loadMessages]);

  const rateMessage = useCallback(async (messageId: number, rating: number) => {
    if (isRatingMessageRef.current) {
      return;
    }

    if (!messageBoard.address || !instance || !ethersSigner) {
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage("Rating must be between 1 and 5");
      return;
    }

    isRatingMessageRef.current = true;
    setIsRatingMessage(true);
    setMessage("Rating message...");

    try {
      const contract = new ethers.Contract(
        messageBoard.address,
        messageBoard.abi,
        ethersSigner
      );

      const encryptedRating = await instance
        .createEncryptedInput(messageBoard.address, ethersSigner.address)
        .add32(rating)
        .encrypt();

      const tx = await contract.rateMessage(
        messageId,
        encryptedRating.handles[0],
        encryptedRating.inputProof
      );

      setMessage("Message rated successfully!");
      await loadMessages(0, messages.length);
    } catch (error) {
      console.error("Failed to rate message:", error);
      setMessage(`Failed to rate message: ${error}`);
    } finally {
      isRatingMessageRef.current = false;
      setIsRatingMessage(false);
    }
  }, [messageBoard.address, messageBoard.abi, instance, ethersSigner, loadMessages, messages.length]);

  return {
    contractAddress: messageBoard.address,
    isDeployed,
    messages,
    messageCount,
    message,
    isLoadingMessages,
    isPostingMessage,
    isRatingMessage,
    canLoadMessages,
    canPostMessage,
    canRateMessage,
    hasMoreMessages,
    loadMessages,
    loadMessageCount,
    postMessage,
    rateMessage,
  };
};
