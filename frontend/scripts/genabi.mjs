import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAMES = ["FHECounter", "MessageBoard"];

// <root>/fhevm-hardhat-template/deployments
const rel = "../fhevm-hardhat-template/deployments";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting deployments directory at ${dir}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(dir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto project root\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(
    path.join(chainDeploymentDir, `${contractName}.json`),
    "utf-8"
  );

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

function generateContractFiles(contractName) {
  // Auto deployed on Linux/Mac (will fail on windows)
  const deployLocalhost = readDeployment("localhost", 31337, contractName, false /* optional */);

  // Sepolia is optional - if not found, skip this contract
  let deploySepolia = null;
  try {
    deploySepolia = readDeployment("sepolia", 11155111, contractName, true /* optional */);
  } catch (error) {
    console.log(`Skipping ${contractName} for Sepolia (not deployed)`);
    deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
  }

  if (!deploySepolia) {
    deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
  }

  if (deployLocalhost && deploySepolia) {
    if (
      JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
    ) {
      console.error(
        `${line}Deployments on localhost and Sepolia differ. Cant use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
      );
      process.exit(1);
    }
  }

  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;
  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}Addresses = {
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

  console.log(`Generated ${path.join(outdir, `${contractName}ABI.ts`)}`);
  console.log(`Generated ${path.join(outdir, `${contractName}Addresses.ts`)}`);

  fs.writeFileSync(path.join(outdir, `${contractName}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${contractName}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );
}

// Generate files for all contracts
for (const contractName of CONTRACT_NAMES) {
  generateContractFiles(contractName);
}