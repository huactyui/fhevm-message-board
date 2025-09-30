// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHEVM Message Board Contract
/// @author zama-fhevm-message-board
/// @notice A decentralized message board using FHEVM for privacy features
contract MessageBoard is SepoliaConfig {

    struct Message {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        bool isEncrypted;
        euint32 encryptedRating;
    }

    Message[] private _messages;
    uint256 private _nextMessageId;

    mapping(address => uint256[]) private _userMessages;

    event MessagePosted(uint256 indexed messageId, address indexed author, bool isEncrypted);
    event RatingUpdated(uint256 indexed messageId, address indexed rater);

    constructor() {
        _nextMessageId = 1;
    }

    /// @notice Post a public message to the board
    /// @param content The message content
    function postMessage(string calldata content) external {
        require(bytes(content).length > 0, "Message cannot be empty");
        require(bytes(content).length <= 1000, "Message too long");

        uint256 messageId = _nextMessageId++;
        _messages.push(Message({
            id: messageId,
            author: msg.sender,
            content: content,
            timestamp: block.timestamp,
            isEncrypted: false,
            encryptedRating: FHE.asEuint32(0)
        }));

        _userMessages[msg.sender].push(messageId);
        FHE.allowThis(_messages[_messages.length - 1].encryptedRating);

        emit MessagePosted(messageId, msg.sender, false);
    }

    /// @notice Post an encrypted message (content is encrypted off-chain)
    /// @param encryptedContent Encrypted message content
    function postEncryptedMessage(string calldata encryptedContent) external {
        require(bytes(encryptedContent).length > 0, "Encrypted message cannot be empty");

        uint256 messageId = _nextMessageId++;
        _messages.push(Message({
            id: messageId,
            author: msg.sender,
            content: encryptedContent,
            timestamp: block.timestamp,
            isEncrypted: true,
            encryptedRating: FHE.asEuint32(0)
        }));

        _userMessages[msg.sender].push(messageId);
        FHE.allowThis(_messages[_messages.length - 1].encryptedRating);

        emit MessagePosted(messageId, msg.sender, true);
    }

    /// @notice Rate a message (encrypted rating)
    /// @param messageId The ID of the message to rate
    /// @param encryptedRating The encrypted rating value (1-5)
    /// @param inputProof The input proof for the encrypted rating
    function rateMessage(uint256 messageId, externalEuint32 encryptedRating, bytes calldata inputProof) external {
        require(messageId > 0 && messageId < _nextMessageId, "Invalid message ID");

        Message storage message = _messages[messageId - 1];
        euint32 rating = FHE.fromExternal(encryptedRating, inputProof);

        // Ensure rating is between 1 and 5
        euint32 minRating = FHE.asEuint32(1);
        euint32 maxRating = FHE.asEuint32(5);
        euint32 validRating = FHE.select(FHE.lt(rating, minRating), minRating,
                               FHE.select(FHE.gt(rating, maxRating), maxRating, rating));

        message.encryptedRating = FHE.add(message.encryptedRating, validRating);
        FHE.allowThis(message.encryptedRating);

        emit RatingUpdated(messageId, msg.sender);
    }

    /// @notice Get message count
    /// @return The total number of messages
    function getMessageCount() external view returns (uint256) {
        return _messages.length;
    }

    /// @notice Get a specific message
    /// @param messageId The ID of the message
    /// @return id The message ID
    /// @return author The message author
    /// @return content The message content
    /// @return timestamp The message timestamp
    /// @return isEncrypted Whether the message is encrypted
    /// @return encryptedRating The encrypted rating
    function getMessage(uint256 messageId) external view returns (
        uint256 id,
        address author,
        string memory content,
        uint256 timestamp,
        bool isEncrypted,
        euint32 encryptedRating
    ) {
        require(messageId > 0 && messageId < _nextMessageId, "Invalid message ID");
        Message storage message = _messages[messageId - 1];
        return (
            message.id,
            message.author,
            message.content,
            message.timestamp,
            message.isEncrypted,
            message.encryptedRating
        );
    }

    /// @notice Get messages in a range
    /// @param startIndex Start index (0-based)
    /// @param count Number of messages to return
    /// @return ids Array of message IDs
    /// @return authors Array of message authors
    /// @return contents Array of message contents
    /// @return timestamps Array of message timestamps
    /// @return isEncryptedFlags Array of encryption flags
    /// @return encryptedRatings Array of encrypted ratings
    function getMessages(uint256 startIndex, uint256 count) external view returns (
        uint256[] memory ids,
        address[] memory authors,
        string[] memory contents,
        uint256[] memory timestamps,
        bool[] memory isEncryptedFlags,
        euint32[] memory encryptedRatings
    ) {
        require(startIndex < _messages.length, "Start index out of bounds");

        uint256 endIndex = startIndex + count;
        if (endIndex > _messages.length) {
            endIndex = _messages.length;
        }

        uint256 resultCount = endIndex - startIndex;
        ids = new uint256[](resultCount);
        authors = new address[](resultCount);
        contents = new string[](resultCount);
        timestamps = new uint256[](resultCount);
        isEncryptedFlags = new bool[](resultCount);
        encryptedRatings = new euint32[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            Message storage message = _messages[startIndex + i];
            ids[i] = message.id;
            authors[i] = message.author;
            contents[i] = message.content;
            timestamps[i] = message.timestamp;
            isEncryptedFlags[i] = message.isEncrypted;
            encryptedRatings[i] = message.encryptedRating;
        }
    }

    /// @notice Get user's messages
    /// @param user The user address
    /// @return Array of message IDs by the user
    function getUserMessages(address user) external view returns (uint256[] memory) {
        return _userMessages[user];
    }
}
