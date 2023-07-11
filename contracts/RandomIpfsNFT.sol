// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RandomIpfsNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    //when we mint an NFT, we will trigger a chainlink VRF call to get us a random number
    //using that number, we will get a random NFT
    //Random NFT : PUG, SHIBA INU, ST. BERNARD
    //PUG : Super rare
    //SHIBA INU : Rare
    //ST. BERNARD : Common

    //users have to pay to mint an NFT
    //the owner of the contract can withdraw the ETH

    //requesting for the random NFT

    error RandomIpfsNFT__RangeOutOfBounds();
    error RandomIpfsNFT__NeedMoreETHSent();
    error RandomIpfsNFT__TransferFailed();

    //Type Declaration
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    //Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //VRF Helpers
    mapping(uint => address) public s_requestIdToSender;

    //NFT Variables
    uint public s_tokenCounter;
    uint internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint internal immutable i_mintFee;

    //Events
    event NftRequested(uint requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNFT__NeedMoreETHSent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        //We need to map as requestNft will call fullfill Random words which is done by the chainlink i.e. the NFT owner will be chainlink to prevent this we map the request id to the owners address
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint requestId, uint[] memory randomWords) internal override {
        address dogOwner = s_requestIdToSender[requestId];
        uint newTokenId = s_tokenCounter;
        //what does this token look like
        uint moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        //0 - 99
        //7 -> PUG
        //12 -> SHIBA INU
        //55 -> ST BERNARD
        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUris[uint(dogBreed)]);
        emit NftMinted(dogBreed, dogOwner);
    }

    function withdraw() public onlyOwner {
        uint amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNFT__TransferFailed();
        }
    }

    function getBreedFromModdedRng(uint ModdedRng) public pure returns (Breed) {
        uint cumulativeSum = 0;
        uint[3] memory chanceArray = getChanceArray();
        for (uint i = 0; i < chanceArray.length; i++) {
            if (ModdedRng >= cumulativeSum && ModdedRng < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNFT__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns (uint) {
        return i_mintFee;
    }

    function getTokenCounter() public view returns (uint) {
        return s_tokenCounter;
    }
}
