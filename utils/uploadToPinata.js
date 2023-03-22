// pinFileToIPFS / pinJsonToIPFS
const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY || "";
console.log(pinataApiKey);
const pinataApiSecret = process.env.PINATA_API_SECRET || "";
// Require api key and api secret
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath); // Read directory
  let responses = [];
  console.log("uploading to IPFS");
  for (const fileIndex in files) {
    // Create a read stream, stream all data inside the images
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    const options = {
      pinataMetadata: {
        name: files[fileIndex],
      },
    };
    try {
      const response = await pinata.pinFileToIPFS(
        readableStreamForFile,
        options
      );
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
  return { responses, files };
}

// Store JSON to pinata / ipfs
async function storeTokenUriMetadata(metadata) {
  try {
    // Send JSON to Pinata for direct pinning to IPFS
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

module.exports = { storeImages, storeTokenUriMetadata };
