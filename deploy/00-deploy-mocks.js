const { developmentChains } = require("../helper-hardhat-config")

module.exports = async (hre) => {
    const { deployments, getNamedAccounts, network, ethers } = hre

    const BASE_FEE = ethers.parseEther("0.25")
    const GAS_PRICE_LINK = 1e9

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("local network detected. Deploying mocks........")
        //deploy a mockVrfCoordinator
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deployed!")
        log("--------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
