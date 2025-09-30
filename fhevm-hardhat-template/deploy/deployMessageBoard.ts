import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedMessageBoard = await deploy("MessageBoard", {
    from: deployer,
    log: true,
  });

  console.log(`MessageBoard contract: `, deployedMessageBoard.address);
};
export default func;
func.id = "deploy_messageBoard"; // id required to prevent reexecution
func.tags = ["MessageBoard"];
