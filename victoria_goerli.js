const ethers = require('ethers');
const fs = require('fs');
require("dotenv").config();
const goerli_abi = require("./ABI/faucet.json");
const matic_staking_abi = require("./ABI/staking.json");
const erc20_abi = require('./ABI/erc20.json');
const provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_API);
const contractAddr = "0x11fe0b9b1a408f5d790c6ea5666ee6f31306408f";
const maticContract = '0x499d11e0b6eac7c0593d8fb292dcbbf815fb29ae';
const maticStakingContract = '0xe29d3d4d72997b31ccdf8188113c189f1106f6b8';
const csMaticContract = '0x3fb4601911871b635011aF01eDda5854F27560ce';


function getUserCoolDown(address) {
    return new Promise(async (resolve) => {
        const contract = new ethers.Contract(contractAddr, goerli_abi, provider);
        let nextClaim = await contract.getUsersCooldown(maticContract, address);
        resolve(nextClaim.timeLeft.toNumber());//next claim in x seconds
    });
}

function depositToken(wallet, amount) {
    return new Promise(async (resolve) => {
        const claystack = new ethers.Contract(maticStakingContract, matic_staking_abi, provider);
        const signer = claystack.connect(wallet);
        signer.deposit("" + amount, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            console.log(`${wallet.address} staked ${amount / 1e18} Matic`);
            resolve(true);
        }).catch(err => {
            console.log("Deposit token error: " + err.reason);
            resolve(false)
        });
    });
}

function withdrawToken(wallet, amount) {
    return new Promise(async (resolve) => {
        const claystack = new ethers.Contract(maticStakingContract, matic_staking_abi, provider);
        const signer = claystack.connect(wallet);
        signer.withdraw("" + amount, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 1000000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            let rc = await result.wait();
            let timestamp = Math.floor((new Date().getTime()) / 1000);
            const event = rc.events.find(event => event.event === 'LogWithdraw');
            const [user, orderId] = event.args;
            writeOutput('goerli_orders.txt', `${user}:${orderId}:${timestamp}\n`);
            console.log(`${wallet.address} withdrew ${amount / 1e18} csMatic`);
            resolve(true);
        }).catch(err => {
            console.log("Withdraw token error: " + err.reason);
            resolve(false)
        });
    });
}
function getLines(filename) {
    if (!fs.existsSync(filename)) {
        return [];
    } else {
        let list = fs.readFileSync(filename)
        let lines = list.toString().split(/\r?\n/)
        return lines;
    }
}
function arrayRemove(arr, value) {
    return arr.filter(function (ele) {
        return ele != value;
    });
}
function writeOutput(file, data) {
    fs.appendFile(file, data, function (err) {
        if (err) throw err;
    });
}
function claim(wallet, orderIds) {
    return new Promise(async (resolve, reject) => {
        const claystack = new ethers.Contract(maticStakingContract, matic_staking_abi, provider);
        const signer = claystack.connect(wallet);
        signer.claim(orderIds, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            for (let orderId of orderIds) {
                writeOutput('goerli_orders.txt', `${wallet.address}:${orderId}:0\n`);
            }
            console.log(`${wallet.address} claimed ` + orderIds);
            resolve(true);
        }).catch(err => {
            console.log(`${wallet.address} Claim error: ${err.reason}`);
            for (let orderId of orderIds) {
                writeOutput('rinkeby_orders.txt', `${wallet.address}:${orderId}:0\n`);
            }
            resolve(false)
        });
    });
}

function hasApproved(tokenAddress, myAddress, spender) {
    return new Promise(async (resolve) => {
        const contract = new ethers.Contract(tokenAddress, erc20_abi, provider);
        let isApproved = await contract.allowance(myAddress, spender);
        resolve(isApproved > 0 ? true : false);
    });
}

function approve(wallet, tokenAddress, spender) {
    return new Promise(async (resolve) => {
        let maxAmount = "999999999000000000000000000";
        const claystack = new ethers.Contract(tokenAddress, erc20_abi, provider);
        const signer = claystack.connect(wallet);
        signer.approve(spender, maxAmount, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            console.log(`${wallet.address} approved ${spender} to spend your token`);
            resolve(true);
        }).catch(err => {
            console.log("Approve error: " + err.reason);
            resolve(false)
        });
    });
}

function getTokenBalance(address, tokenContract) {
    return new Promise(async (resolve, reject) => {
        const contract = new ethers.Contract(tokenContract, erc20_abi, provider);
        let balance = await contract.balanceOf(address);
        resolve(Number(balance));
    });
}

function claimFaucetMatic(wallet) {
    return new Promise(async (resolve, reject) => {
        const claystack = new ethers.Contract(contractAddr, goerli_abi, provider);
        const signer = claystack.connect(wallet);
        signer.claimTokens(maticContract, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            console.log(`${wallet.address} claimed 1 Matic from the faucet`);
            resolve(true);
        }).catch(err => {
            console.log("Claim matic from the faucet error: " + err.reason);
            resolve(false)
        });
    });
}
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
function getClaimableOrders(myAddress) {
    return new Promise((resolve) => {
        let orders = getLines('goerli_orders.txt');
        let claimOrders = [];
        for (let order of orders) {
            if (order) {
                let address = order.split(":")[0];
                if (address == myAddress) {
                    let withdrewTimestamp = order.split(":")[2];
                    let orderId = order.split(":")[1];
                    if (withdrewTimestamp == 0) {
                        if (claimOrders.includes(orderId)) {
                            if (claimOrders.length == 1) {
                                claimOrders = []
                            } else {
                                claimOrders = arrayRemove[claimOrders, orderId];
                                if(claimOrders==undefined){
                                    claimOrders=[];
                                }
                            }
                        }
                    } else {
                        let currentTimestamp = Math.floor((new Date().getTime()) / 1000);
                        if (currentTimestamp - withdrewTimestamp > 46800) {
                            claimOrders.push(orderId);
                        }
                    }
                }
            }
        }
        resolve(claimOrders)
    })

}
async function start(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    let coolDown = await getUserCoolDown(wallet.address);
    if (coolDown == 0) {
        await claimFaucetMatic(wallet);
        await sleep(10000);
    }

    let maticBalance = await getTokenBalance(wallet.address, maticContract);
    if (maticBalance > 10000000) {
        let isApproved = await hasApproved(maticContract, wallet.address, maticStakingContract);
        if (!isApproved) {
            await approve(wallet, maticContract, maticStakingContract);
        }
        await depositToken(wallet, maticBalance - 1000000);
    }

    let csMaticBalance = await getTokenBalance(wallet.address, csMaticContract);
    if (csMaticBalance > 10000000) {
        await withdrawToken(wallet, csMaticBalance - 1000000);
    }
    let orderIds = await getClaimableOrders(wallet.address);
    if (orderIds.length > 0) {
        await claim(wallet, orderIds);
    }
}

let keys = process.env.KEYS.split(",");
for (let key of keys) {
    start(key)
}
