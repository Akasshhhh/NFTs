const { ethers } = require("hardhat")

//const BASE_FEE = ethers.utils.parseEther("0.25") //0.25 LINK per request
//const GAS_PRICE_LINK = 1e9 //LINK per gas //1000000000

const networkConfig = {
    5: {
        name: "goerli",
        vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: "9619",
        callbackGasLimit: "500000",
        Interval: "30",
        mintFee: "100000000000000000", //0.01
    },
    31337: {
        name: "hardhat",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000",
        Interval: "30",
        mintFee: "100000000000000000", //0.01
    },
}

const DECIMALS = "18"
const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
}
