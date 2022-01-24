const ethers = require('ethers');
require("dotenv").config();
const provider = new ethers.providers.JsonRpcProvider("https://eth-goerli.alchemyapi.io/v2/PW-CqflHcDdT6qnov8gCvBcrA0js50UC");

// const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
const INTERVAL = 30;//Run every 30 minutes
const abi = require("./ABI/abi.json");
let tokensMap = new Map();
// tokensMap.set('Melville', '0xf66bA729ce62F97DaD71BfFAe842925Ba629F741,1380');
// tokensMap.set('Tana', '0x335e2d611384193af84bfe949971eafcea5a7de1,96');
// tokensMap.set('Peipus', '0xfd769a11a1ab3bdfd6fad3c9e20ba2ce322f8ae1,158');
// tokensMap.set('Saimaa', '0x3E3A5efDc4AbA0D92D0A2F52d107E2D45DB6670a,158');
// tokensMap.set('Taymyr', '0x013aadf384f67869af3de4e18d788d3ff3126238,8066');
tokensMap.set('Manitoba', '0xcc17c2da3dc8e480bd070740981d0b561fa39103,180');
// tokensMap.set('Mewru', '0x3557042e5f74b85e6b807192a37e773f9d4be082,428');
tokensMap.set('Albert', '0x4fe9670ed85ac6beadc0ce1dec131f1e86e717c0,128');
tokensMap.set('Urnia', '0xC2c2fc434F2ab8D7eae92374dBc2F8E6cCf10EAb,178');
// tokensMap.set('Turkana', '0xdd0895b6c6e50a2bf0625f1e2cd36cfabbd52a93,10');
// tokensMap.set('Nicaragua', '0x786d9a54a0437c2d3bdb44ee6cf57dfff6484131,158');
// tokensMap.set('Onega', '0x1167788F415A162e6016936F458FD92C32823630,308');
// tokensMap.set('Vostok', '0xe43cFea1F09b863D8061F792dc50e904903696cF,68');
tokensMap.set('Balkhash', '0x85f0ca0045a96abde82363f9ba8426061fefd84c,20');
tokensMap.set('Ontario', '0xe9c754207f2fb01debf8a1b3aa9f45c4aeb79637,500');
// tokensMap.set('Erie', '0xfC4B76B567A9a17Cefd1D960C3478b16d9623f2a,138');
// tokensMap.set('Malawi', '0x41a1b53df60920cb4ca6beb6c1acc8d914f47067,128');
// tokensMap.set('Baikal', '0x0617A90edF7F8412133C839cbDe409aAC589280C,98');
// tokensMap.set('Santa', '0xe654d4db9893556011b354b4360ced426f823f35');
// tokensMap.set('NY2022', '0xa93246d1928F15b1763399E71a8890BEc2519FEC,121');

let fromPrivateKey = process.env.collectToFinishFrom;
let to = "0xB092C82fb2F2ed431bc4F1E731D60a3F891aca61";

const args = process.argv.slice(2)
// args[0]

let keys = process.env.KEYS.split(",");
let toFinishPrivateKey =  keys[args[0]];
let walletTo = new ethers.Wallet(toFinishPrivateKey);
console.log(`walletTo index :${args[0]}`)
console.log(`walletTo.getAddress:${walletTo.address}`)


console.log(`typeof walletTo.getAddress:${typeof(walletTo.address)}`)

start(fromPrivateKey, walletTo.address);

// 函数实现，参数单位 毫秒 ；
function wait(ms) {
    return new Promise(resolve =>setTimeout(() =>resolve(), ms));
};

async function start(privateKey, to) {
    const wallet = new ethers.Wallet(privateKey, provider);
    const signer = wallet.connect(provider);
    let nonce = await provider.getTransactionCount(wallet.address);

    for (let [key, token] of tokensMap) {
        await wait(300);
        // let balance = await getBalance(token, wallet.address);

        if (wallet.address != to) {
            
            await send(signer, token.split(",")[0], nonce, (token.split(",")[1])+"000000000000000000", to);
            nonce += 1;
            console.log(`${wallet.address} sending ${(token.split(",")[1])} ${key} to ${to}`);
        }
    }

}
async function send(signer, contractAddr, nonce, value, to) {
    return new Promise(async (resolve, reject) => {
        const contract = new ethers.Contract(contractAddr, abi, signer);
        const tx = await contract.transfer(to, value, { nonce: nonce });
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