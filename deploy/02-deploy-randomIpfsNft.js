const { network, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetaData } = require("../utils/uploadToPinata")

const imageLocation = "./images"

const metadataTemplate = {
    name: "",
    description: "",
    images: "",
    attributes: {
        traitType: "cuteness",
        value: 100,
    },
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let tokenUris
    //get the ipfs hashes of our image
    if ((process.env.UPLOAD_TO_PINATA = "true")) {
        tokenUris = await handleTokenUris()
    }

    let vrfCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = 1
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("---------------------------------------")

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNFT = await deploy("RandomIpfsNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("-----------------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifying....")
        await verify(randomIpfsNFT.address, args)
    }
}

async function handleTokenUris() {
    tokenUris = []
    //store the image in IPFS
    //store the metadate in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imageLocation)
    for (imageUploadResponseIndex in imageUploadResponses) {
        //create metadata
        //upload metadata
        let tokenUriMetaData = { ...metadataTemplate }
        tokenUriMetaData.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetaData.description = `An adorable ${tokenUriMetaData.name} pup!`
        tokenUriMetaData.images = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetaData.name}...`)
        //store the JSON to Pinata
        const metadataUploadResponse = await storeTokenUriMetaData(tokenUriMetaData)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs Uploaded....")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "random"]
