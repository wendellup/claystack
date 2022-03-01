const ethers = require('ethers');
require("dotenv").config();
const axios = require('axios')
let abi = require("./ABI/claystack.json");
const provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_API);
let contractAddr = "0x7b067b776deC24CF0c2390e76Dea20217e75D9F7";
let keys = process.env.KEYS.split(",");
for (let key of keys) {
    start(key)
}




function hasRegistered(address) {
    return new Promise((resolve, reject) => {
        axios.get(`https://app.claystack.com/api/snapshot?address=${address}`).then(res => {
            if (res.data.allocation.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }

        }).catch(err => {
            console.log(err);
        })
    });
}




async function start(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    const claystack = new ethers.Contract(contractAddr, abi, provider);
    const signer = claystack.connect(wallet);
    let isRegistered = await hasRegistered(wallet.address);
    if (!isRegistered) {
        const tx = await signer.start({
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000
        });
        console.log(`${wallet.address} just registered for the game!`);
    }
}
