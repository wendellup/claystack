const ethers = require('ethers');
const fs = require('fs');
require("dotenv").config();
const goerli_abi = require("./ABI/faucet.json");
const matic_staking_abi = require("./ABI/staking.json");
const erc20_abi = require('./ABI/erc20.json');
const provider = new ethers.providers.JsonRpcProvider(process.env.RINKEBY_API);
const clayFaucet = "0x83B7cF23b047Df8b0c69649df43362631cbbEDbF";
const grtContract = '0x54Fe55d5d255b8460fB3Bc52D5D676F9AE5697CD';
const grtStakingContract = '0x880C80C6739C05F9ddB8Bc2597B65d1EC9B92C10';
const csGrtContract = '0xb5bEA89ac64555FBa349088434A5Ca21236C23CC';


function getUserCoolDown(address) {
    return new Promise(async (resolve) => {
        const contract = new ethers.Contract(clayFaucet, goerli_abi, provider);
        let nextClaim = await contract.getUsersCooldown(grtContract, address);
        resolve(nextClaim.timeLeft.toNumber());//next claim in x seconds
    });
}

function depositToken(wallet, amount) {
    return new Promise(async (resolve) => {
        const claystack = new ethers.Contract(grtStakingContract, matic_staking_abi, provider);
        const signer = claystack.connect(wallet);
        signer.deposit("" + amount, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            console.log(`${wallet.address} staked ${amount / 1e18} GRT`);
            resolve(true);
        }).catch(err => {
            console.log("Deposit token error: " + err.reason);
            resolve(false)
        });
    });
}

function withdrawToken(wallet, amount) {
    return new Promise(async (resolve) => {
        const claystack = new ethers.Contract(grtStakingContract, matic_staking_abi, provider);
        const signer = claystack.connect(wallet);

        signer.withdraw("" + amount, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 1000000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            let rc = await result.wait();
            let timestamp = Math.floor((new Date().getTime()) / 1000);
            const event = rc.events.find(event => event.event === 'LogWithdraw');
            const [user, orderId] = event.args;
            writeOutput('rinkeby_orders.txt', `${user}:${orderId}:${timestamp}\n`);
            console.log(`${wallet.address} withdrew ${amount / 1e18} csMatic`);
            resolve(true);
        }).catch(err => {
            console.log(err)
            console.log("Withdraw token error: " + err.reason);
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

function claimFaucetGrt(wallet) {
    return new Promise(async (resolve, reject) => {
        const claystack = new ethers.Contract(clayFaucet, goerli_abi, provider);
        const signer = claystack.connect(wallet);
        signer.claimTokens(grtContract, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            console.log(`${wallet.address} claimed 10 GRT from the faucet`);
            resolve(true);
        }).catch(err => {
            console.log("Claim GRT from the faucet error: " + err.reason);
            resolve(false)
        });
    });
}

function claim(wallet, orderIds) {
    return new Promise(async (resolve, reject) => {
        const claystack = new ethers.Contract(grtStakingContract, matic_staking_abi, provider);
        const signer = claystack.connect(wallet);
        signer.claim(orderIds, {
            gasPrice: await provider.getGasPrice(),
            gasLimit: 500000,
            value: ethers.utils.parseEther("0")
        }).then(async (result) => {
            await result.wait();
            for (let orderId of orderIds) {
                writeOutput('rinkeby_orders.txt', `${wallet.address}:${orderId}:0\n`);
            }
            console.log(`${wallet.address} claimed ` + orderIds);
            resolve(true);
        }).catch(err => {
            console.log(`${wallet.address} Claim error: ${err.reason}`);
            resolve(false)
        });
    });
}
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
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
function getClaimableOrders(myAddress) {
    return new Promise((resolve) => {
        let orders = getLines('rinkeby_orders.txt');
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
                        if (currentTimestamp - withdrewTimestamp > 21600) {
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
        await claimFaucetGrt(wallet);
        await sleep(10000);
    }

    let grtBalance = await getTokenBalance(wallet.address, grtContract);
    if (grtBalance > 1000000) {
        let isApproved = await hasApproved(grtContract, wallet.address, grtStakingContract);
        if (!isApproved) {
            await approve(wallet, grtContract, grtStakingContract);
        }
        await depositToken(wallet, grtBalance - 1000000);
    }

    let csMaticBalance = await getTokenBalance(wallet.address, csGrtContract);
    if (csMaticBalance > 1000000) {
        await withdrawToken(wallet, csMaticBalance - 1000000);
    }
    let orderIds = await getClaimableOrders(wallet.address);
    if (orderIds.length > 0) {
        console.log(wallet.address)
        await claim(wallet, orderIds);
    }
}

let keys = process.env.KEYS.split(",");
for (let key of keys) {
    start(key)
}
