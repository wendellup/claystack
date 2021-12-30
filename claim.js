const ethers = require('ethers');
require("dotenv").config();
const INTERVAL = 1;//Run every 1 minute
let abi = require("./ABI/claystack.json");
const provider = new ethers.providers.JsonRpcProvider(process.env.API);
let contractAddr = "0x7b067b776dec24cf0c2390e76dea20217e75d9f7";
let keys = process.env.KEYS.split(",");
for (let key of keys) {
    start(key)
}
setInterval(function () {
    for (let key of keys) {
        start(key)
    }
}, INTERVAL * 60 * 1000)


function getNextClaim(address) {
    return new Promise(async (resolve, reject) => {
        const contract = new ethers.Contract(contractAddr, abi, provider);
        let nextClaim = await contract.userNextClaim(address);
        resolve(nextClaim[1].toNumber());//next claim in x seconds
    });
}

function getUserStart(address) {
    return new Promise(async (resolve, reject) => {
        const contract = new ethers.Contract(contractAddr, abi, provider);
        let isStart = await contract.getUserStart(address);
        resolve(isStart);
    });
}

async function start(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    const claystack = new ethers.Contract(contractAddr, abi, provider);
    const signer = claystack.connect(wallet);
    let isStart = await getUserStart(wallet.address);
    console.log(ethers.utils.parseEther("1.0"))
    if (isStart) {
        let nextClaim = await getNextClaim(wallet.address);
        console.log(`${wallet.address} next claim in ${nextClaim} seconds`);
        if (nextClaim == 0) {
            const tx = await signer.package({
                gasPrice: await provider.getGasPrice(),
                gasLimit: 500000,
                value: ethers.utils.parseEther("0.2")
            });
            console.log(`${wallet.address} claimed the package`);
        }
    }
}
