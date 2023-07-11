const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Unit Tests", () => {
          let basicnft, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"])
              basicnft = await ethers.getContract("BasicNFT")
          })

          describe("Constructor", () => {
              it("initializes the NFT correctly", async () => {
                  const name = await basicnft.name()
                  const symbol = await basicnft.symbol()
                  const tokenCounter = await basicnft.getTokenCounter()
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("Mint NFT", () => {
              beforeEach(async () => {
                  const txResponse = await basicnft.mintNft()
                  txResponse.wait(1)
              })
              it("Allows user to mint an NFT, and updates appropriately", async () => {
                  const tokenURI = await basicnft.tokenURI(0)
                  const tokenCounter = await basicnft.getTokenCounter()
                  assert.equal(tokenURI, await basicnft.TOKEN_URI())
                  assert.equal(tokenCounter.toString(), "1")
              })

              it("Shows the correct balance and owner of an NFT", async () => {
                  const deployerAddress = deployer.address
                  const deployerBalance = await basicnft.balanceOf(deployerAddress)
                  const owner = await basicnft.ownerOf("0")

                  assert.equal(deployerBalance.toString(), "1")
                  assert.equal(owner, deployerAddress)
              })
          })
      })
