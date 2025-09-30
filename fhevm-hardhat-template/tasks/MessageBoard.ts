import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the MessageBoard contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the MessageBoard contract
 *
 *   npx hardhat --network localhost task:post-message --content "Hello FHEVM!"
 *   npx hardhat --network localhost task:get-messages --count 10
 *   npx hardhat --network localhost task:get-message-count
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the MessageBoard contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the MessageBoard contract
 *
 *   npx hardhat --network sepolia task:post-message --content "Hello Sepolia!"
 *   npx hardhat --network sepolia task:get-messages --count 10
 *   npx hardhat --network sepolia task:get-message-count
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:mb-address
 *   - npx hardhat --network sepolia task:mb-address
 */
task("task:mb-address", "Prints the MessageBoard address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const messageBoard = await deployments.get("MessageBoard");

  console.log("MessageBoard address is " + messageBoard.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:get-message-count
 *   - npx hardhat --network sepolia task:get-message-count
 */
task("task:get-message-count", "Calls the getMessageCount() function of MessageBoard Contract")
  .addOptionalParam("address", "Optionally specify the MessageBoard contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const MessageBoardDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MessageBoard");
    console.log(`MessageBoard: ${MessageBoardDeployement.address}`);

    const messageBoardContract = await ethers.getContractAt("MessageBoard", MessageBoardDeployement.address);

    const count = await messageBoardContract.getMessageCount();
    console.log(`Total messages: ${count}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:post-message --content "Hello World!"
 *   - npx hardhat --network sepolia task:post-message --content "Hello Sepolia!"
 */
task("task:post-message", "Posts a message to the MessageBoard Contract")
  .addOptionalParam("address", "Optionally specify the MessageBoard contract address")
  .addParam("content", "The message content to post")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const content = taskArguments.content;
    if (!content || content.trim().length === 0) {
      throw new Error("Content cannot be empty");
    }

    const MessageBoardDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MessageBoard");
    console.log(`MessageBoard: ${MessageBoardDeployement.address}`);

    const signers = await ethers.getSigners();
    const messageBoardContract = await ethers.getContractAt("MessageBoard", MessageBoardDeployement.address);

    const tx = await messageBoardContract
      .connect(signers[0])
      .postMessage(content);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Message posted successfully: "${content}"`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-messages --count 5
 *   - npx hardhat --network sepolia task:get-messages --count 10 --start 0
 */
task("task:get-messages", "Gets messages from the MessageBoard Contract")
  .addOptionalParam("address", "Optionally specify the MessageBoard contract address")
  .addParam("count", "Number of messages to retrieve")
  .addOptionalParam("start", "Start index (default: 0)", "0")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const count = parseInt(taskArguments.count);
    const start = parseInt(taskArguments.start || "0");

    if (!Number.isInteger(count) || count <= 0) {
      throw new Error("Count must be a positive integer");
    }
    if (!Number.isInteger(start) || start < 0) {
      throw new Error("Start must be a non-negative integer");
    }

    const MessageBoardDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MessageBoard");
    console.log(`MessageBoard: ${MessageBoardDeployement.address}`);

    const messageBoardContract = await ethers.getContractAt("MessageBoard", MessageBoardDeployement.address);

    const messages = await messageBoardContract.getMessages(start, count);
    console.log(`Retrieved ${messages[0].length} messages starting from index ${start}:`);

    for (let i = 0; i < messages[0].length; i++) {
      const id = messages[0][i];
      const author = messages[1][i];
      const content = messages[2][i];
      const timestamp = messages[3][i];
      const isEncrypted = messages[4][i];
      const encryptedRating = messages[5][i];

      console.log(`\n--- Message #${id} ---`);
      console.log(`Author: ${author}`);
      console.log(`Content: ${content}`);
      console.log(`Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
      console.log(`Encrypted: ${isEncrypted}`);
      console.log(`Encrypted Rating: ${encryptedRating}`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:rate-message --id 1 --rating 5
 *   - npx hardhat --network sepolia task:rate-message --id 1 --rating 4
 */
task("task:rate-message", "Rates a message on the MessageBoard Contract")
  .addOptionalParam("address", "Optionally specify the MessageBoard contract address")
  .addParam("id", "The message ID to rate")
  .addParam("rating", "The rating value (1-5)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const messageId = parseInt(taskArguments.id);
    const rating = parseInt(taskArguments.rating);

    if (!Number.isInteger(messageId) || messageId <= 0) {
      throw new Error("Message ID must be a positive integer");
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    await fhevm.initializeCLIApi();

    const MessageBoardDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MessageBoard");
    console.log(`MessageBoard: ${MessageBoardDeployement.address}`);

    const signers = await ethers.getSigners();
    const messageBoardContract = await ethers.getContractAt("MessageBoard", MessageBoardDeployement.address);

    // Encrypt the rating value
    const encryptedRating = await fhevm
      .createEncryptedInput(MessageBoardDeployement.address, signers[0].address)
      .add32(rating)
      .encrypt();

    const tx = await messageBoardContract
      .connect(signers[0])
      .rateMessage(messageId, encryptedRating.handles[0], encryptedRating.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Message #${messageId} rated with ${rating} stars successfully!`);
  });
