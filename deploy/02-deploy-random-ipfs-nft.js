const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokenUriMetadata,
} = require("../utils/uploadToPinata");

const imagesLocation = "./images/random";

// Template for json metadata
const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  // Stats of the NFT
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // After deployment
  let tokenUris = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
  ];

  // Get the IPFS hashs of our images, Pinata or with nft.storage
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  }

  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  log("----------------------");
  //await storeImages(imagesLocation);
  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].mintFee,
    networkConfig[chainId].callbackGasLimit,
    tokenUris,
  ];

  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("--------------------");
  if (
    !developmentChains.includes(network.name) &&
    process.env.EHTERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(basicNft.address, args);
  }
};

// Return an array of token uris
async function handleTokenUris() {
  tokenUris = [];
  // Store the image in IPFS and the metadata
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );
  for (imageUploadResponseIndex in imageUploadResponses) {
    // Uppacked, equal to the template
    let tokenUriMetadata = { ...metadataTemplate };
    // Set the name, description, image
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}...`);

    // Store JSON to pinata/IPFS
    const metadataUploadResponse = await storeTokenUriMetadata(
      tokenUriMetadata
    );
    // Push the ipfshash of json to tokenuris
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
