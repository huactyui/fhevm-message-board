"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useMessageBoard } from "@/hooks/useMessageBoard";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { useState, useRef } from "react";
import { Message } from "@/hooks/useMessageBoard";

/*
 * Main MessageBoard React component with modern design
 * Features:
 * - Post messages to the blockchain
 * - View message history
 * - Rate messages with encrypted ratings
 * - Beautiful animated UI with unique design
 */
export const MessageBoard = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  //////////////////////////////////////////////////////////////////////////////
  // FHEVM instance
  //////////////////////////////////////////////////////////////////////////////

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  //////////////////////////////////////////////////////////////////////////////
  // MessageBoard hook
  //////////////////////////////////////////////////////////////////////////////

  const messageBoard = useMessageBoard({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [newMessage, setNewMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
              FHEVM Message Board
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A decentralized message board powered by Fully Homomorphic Encryption.
              Connect your wallet to start sharing messages on the blockchain.
            </p>
          </div>
          <button
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
            onClick={connect}
          >
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  if (!messageBoard.isDeployed) {
    return errorNotDeployed(chainId);
  }

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;

    setIsPosting(true);
    try {
      await messageBoard.postMessage(newMessage.trim());
      setNewMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to post message:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleRateMessage = async (messageId: number, rating: number) => {
    try {
      await messageBoard.rateMessage(messageId, rating);
    } catch (error) {
      console.error("Failed to rate message:", error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4">
              FHEVM Message Board
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Share your thoughts on the blockchain with privacy-preserving encryption.
              Every message is permanent and immutable.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-cyan-400">{messageBoard.messageCount.toString()}</div>
            <div className="text-gray-400">Total Messages</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-purple-400">{messageBoard.messages.length}</div>
            <div className="text-gray-400">Loaded Messages</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-6">
            <div className={`text-3xl font-bold ${fhevmStatus === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
              {fhevmStatus === 'ready' ? 'Active' : 'Loading'}
            </div>
            <div className="text-gray-400">FHEVM Status</div>
          </div>
        </div>

        {/* Post Message Form */}
        <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Share Your Message</h2>
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                adjustTextareaHeight();
              }}
              placeholder="What's on your mind? Write something meaningful..."
              className="w-full bg-slate-800/50 border border-purple-500/30 rounded-2xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[120px] max-h-[300px]"
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {newMessage.length}/1000 characters
              </div>
              <button
                onClick={handlePostMessage}
                disabled={!newMessage.trim() || isPosting || !messageBoard.canPostMessage}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 disabled:transform-none disabled:opacity-50"
              >
                {isPosting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  "Post Message"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {messageBoard.message && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-8">
            <p className="text-blue-400">{messageBoard.message}</p>
          </div>
        )}

        {/* Messages List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Recent Messages</h2>
            <button
              onClick={() => {
                messageBoard.loadMessages(0, 10);
                messageBoard.loadMessageCount();
              }}
              disabled={messageBoard.isLoadingMessages}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              {messageBoard.isLoadingMessages ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                "🔄 Refresh"
              )}
            </button>
          </div>

          {messageBoard.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-400 text-xl mb-4">No messages loaded yet.</p>
              <p className="text-gray-500 text-sm">Click the refresh button above to load messages.</p>
            </div>
          ) : (
            messageBoard.messages.map((msg: Message, index: number) => (
              <div
                key={msg.id.toString()}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {msg.author.slice(2, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{formatAddress(msg.author)}</div>
                      <div className="text-gray-400 text-sm">{formatTimestamp(msg.timestamp)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Message #{msg.id.toString()}</div>
                    {msg.isEncrypted && (
                      <div className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full mt-1 inline-block">
                        🔒 Encrypted
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-gray-200 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Rating Section */}
                <div className="border-t border-slate-700/50 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">Rate this message:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRateMessage(Number(msg.id), star)}
                            disabled={!messageBoard.canRateMessage || messageBoard.isRatingMessage}
                            className="w-8 h-8 text-gray-400 hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Rating: <span className="text-yellow-400">Encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Load More Button */}
          {messageBoard.canLoadMessages && messageBoard.hasMoreMessages && (
            <div className="text-center pt-8">
              <button
                onClick={() => messageBoard.loadMessages(messageBoard.messages.length, 10)}
                disabled={messageBoard.isLoadingMessages}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                {messageBoard.isLoadingMessages ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Load More Messages"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
