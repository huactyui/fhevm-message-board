import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFHECounter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });

  console.log(`FHECounter contract: `, deployedFHECounter.address);
};
export default deployFHECounter;
deployFHECounter.id = "deploy_fheCounter"; // id required to prevent reexecution
deployFHECounter.tags = ["FHECounter"];

const deployMessageBoard: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedMessageBoard = await deploy("MessageBoard", {
    from: deployer,
    log: true,
  });

  console.log(`MessageBoard contract: `, deployedMessageBoard.address);
};
export const deployMessageBoardFunc = deployMessageBoard;
deployMessageBoard.id = "deploy_messageBoard"; // id required to prevent reexecution
deployMessageBoard.tags = ["MessageBoard"];
