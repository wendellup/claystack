const ethers = require('ethers');
require("dotenv").config();
const provider = new ethers.providers.JsonRpcProvider("https://eth-goerli.alchemyapi.io/v2/OePDKEAtMy2lr5W5J8aBCML6qYmeCaFX");
const INTERVAL = 30;//Run every 30 minutes
const abi = require("./ABI/abi.json");
let tokensMap = new Map();
tokensMap.set('Melville', '0xf66bA729ce62F97DaD71BfFAe842925Ba629F741');
tokensMap.set('Tana', '0x335e2d611384193af84bfe949971eafcea5a7de1');
tokensMap.set('Peipus', '0xfd769a11a1ab3bdfd6fad3c9e20ba2ce322f8ae1');
tokensMap.set('Saimaa', '0x3E3A5efDc4AbA0D92D0A2F52d107E2D45DB6670a');
tokensMap.set('Taymyr', '0x013aadf384f67869af3de4e18d788d3ff3126238');
tokensMap.set('Manitoba', '0xcc17c2da3dc8e480bd070740981d0b561fa39103');
tokensMap.set('Mewru', '0x3557042e5f74b85e6b807192a37e773f9d4be082');
tokensMap.set('Albert', '0x4fe9670ed85ac6beadc0ce1dec131f1e86e717c0');
tokensMap.set('Urnia', '0xC2c2fc434F2ab8D7eae92374dBc2F8E6cCf10EAb');
tokensMap.set('Turkana', '0xdd0895b6c6e50a2bf0625f1e2cd36cfabbd52a93');
tokensMap.set('Nicaragua', '0x786d9a54a0437c2d3bdb44ee6cf57dfff6484131');
tokensMap.set('Onega', '0x1167788F415A162e6016936F458FD92C32823630');
tokensMap.set('Vostok', '0xe43cFea1F09b863D8061F792dc50e904903696cF');
tokensMap.set('Balkhash', '0x85f0ca0045a96abde82363f9ba8426061fefd84c');
tokensMap.set('Ontario', '0xe9c754207f2fb01debf8a1b3aa9f45c4aeb79637');
tokensMap.set('Erie', '0xfC4B76B567A9a17Cefd1D960C3478b16d9623f2a');
tokensMap.set('Malawi', '0x41a1b53df60920cb4ca6beb6c1acc8d914f47067');
tokensMap.set('Baikal', '0x0617A90edF7F8412133C839cbDe409aAC589280C');
tokensMap.set('Santa', '0xe654d4db9893556011b354b4360ced426f823f35');

let keys = process.env.KEYS.split(",");
setInterval(function () {
    for (let key of keys) {
        start(key);
    }
}, INTERVAL * 60 * 1000);

async function start(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    const signer = wallet.connect(provider);
    let nonce = await provider.getTransactionCount(wallet.address);

    for (let [key, token] of tokensMap) {
        let balance = await getBalance(token, wallet.address);

        if (wallet.address != process.env.TO && balance > 0) {
            await send(signer, token, nonce, balance);
            nonce += 1;
            console.log(`${wallet.address} sending ${(balance / 1e18).toFixed(2)} ${key} to ${process.env.TO}`);
        }
    }

}
async function send(signer, contractAddr, nonce, value) {
    return new Promise(async (resolve, reject) => {
        const contract = new ethers.Contract(contractAddr, abi, signer);
        const tx = await contract.transfer(process.env.TO, value, { nonce: nonce });
        resolve(tx.hash);
    })
}
async function getBalance(contractAddr, address) {
    return new Promise(async (resolve, reject) => {
        const contract = new ethers.Contract(contractAddr, abi, provider);
        const balanceOf = await contract.balanceOf(address);
        resolve(balanceOf);
    });
}