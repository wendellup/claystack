const ethers = require('ethers');
const fs = require('fs')
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/21521d3bc5f24eea8df0e5f2dbd29592");

let keys = process.env.KEYS.split(",");
const INTERVAL = 60 * 24;//Run every 1 minute
const args = process.argv.slice(2)
let toFinishPrivateKey = keys[args[0]];
// let toFinishPrivateKey =  process.env.toFinishPrivateKey;
// let toFinishPrivateKey =  keys[32];

let transactionWaitMillis = 60000;

let wallet = new ethers.Wallet(toFinishPrivateKey, provider);
let signer = wallet.connect(provider);
let nonce = 0;
// start();

let userAry = [];


// let okAray = [1, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]
let okAray = [1]
console.log(okAray.includes(1));




runLoop();
async function runLoop() {
  await loop();
  setInterval(function () {
    loop();
  }, (INTERVAL + 3) * 60 * 1000)
}


function updateAccountClaimMaticCountToFile(index, num) {
  if (num == 0) {
    let rawdata = fs.readFileSync('accountStatus.json');
    let accountStatus = JSON.parse(rawdata);
    accountStatus[index].claimWithdrawMaticCount = 1 + accountStatus[index].claimWithdrawMaticCount;
    let data = JSON.stringify(accountStatus);
    fs.writeFileSync('accountStatus.json', data);
    userAry = loadAccountStatusFromFile();
  } else {
    let rawdata = fs.readFileSync('accountStatus.json');
    let accountStatus = JSON.parse(rawdata);
    accountStatus[index].claimWithdrawMaticCount = num;
    let data = JSON.stringify(accountStatus);
    fs.writeFileSync('accountStatus.json', data);
    userAry = loadAccountStatusFromFile();
  }
}

function updateAccountwithdrawMaticCountToFile(index) {
  let rawdata = fs.readFileSync('accountStatus.json');
  let accountStatus = JSON.parse(rawdata);
  accountStatus[index].withdrawMaticCount = 1 + accountStatus[index].withdrawMaticCount;
  let data = JSON.stringify(accountStatus);
  fs.writeFileSync('accountStatus.json', data);
  userAry = loadAccountStatusFromFile();
}

function loadAccountStatusFromFile() {
  let rawdata = fs.readFileSync('accountStatus.json');
  let accountStatus = JSON.parse(rawdata);
  return accountStatus;
}



// let keys = process.env.KEYS.split(",");
// for (let key of keys) {

async function loop() {

  userAry = loadAccountStatusFromFile();
  console.log(userAry.length);

  for (let i = 0; i < keys.length; i++) {
    if(userAry[i].withdrawMaticCount==0){
      continue;
    } 

    if (!okAray.includes(i + 1)){
      continue;
    }
    console.log(`handler:${i + 1}`);
    try {
      toFinishPrivateKey = keys[i];
      wallet = new ethers.Wallet(toFinishPrivateKey, provider);
      signer = wallet.connect(provider);
      await start(i);
    } catch (error) {
      console.log(error);
    }

  }

}





// 函数实现，参数单位 毫秒 ；
function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

async function start(i) {

  nonce = await provider.getTransactionCount(wallet.address);
  console.log(`Now nonce is ${nonce}`)

  // await claimGoerliMatic();
  // await wait(26000);
  // nonce= nonce+1;

  // await approveGoerliMatic()
  // await wait(20000);
  // nonce= nonce+1;

  await stakeGoerliMatic();

  await unStakeGoerliMatic(i);
  // await wait(transactionWaitMillis); unStake中已经有等待了

  console.log(`id is ${userAry[i].id}, userAry[i] address is ${userAry[i].address}, wallet.address is ${wallet.address}, claimWithdrawMaticCount:${userAry[i].claimWithdrawMaticCount}, withdrawMaticCount:${userAry[i].withdrawMaticCount} `)
  if (userAry[i].claimWithdrawMaticCount+1 < userAry[i].withdrawMaticCount) {
    console.log(`id is ${userAry[i].id}, call claimUnStakeGoerliMatic`)
    await claimUnStakeGoerliMatic(i)
  }


}



function padStart(n, str) {
  str = String(str);
  return Array(str.length >= n ? 0 : n - str.length + 1).join('0') + str;
}


function getRandomUnstakeMatic() {
  let num = Math.random() * 3 + 1;
  // let num = 100
  // console.log(num);
  // console.log(typeof(num));
  let unstakeNum = num * 1e18;
  unstakeNum = ~~(unstakeNum / 1e15);
  unstakeNum = unstakeNum * 1e15;
  // console.log(unstakeNum);
  let hexStr = unstakeNum.toString(16);
  // console.log(hexStr);
  hexStr = padStart(64, hexStr);
  return hexStr;
}


async function approveGoerliMatic() {
  const contract = '0x499d11e0b6eac7c0593d8fb292dcbbf815fb29ae';
  // let nonce = await provider.getTransactionCount(wallet.address);

  console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is approveGoerliMatic `)
  const tx = {
    // 'from': endData[i].split(',')[0],
    'from': wallet.address,
    'to': contract,
    'data': '0x095ea7b3000000000000000000000000748c2370dc892f2a1fc9947b1264ef0fad58b12bffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'nonce': nonce,
    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }

  await wallet.signTransaction(tx).then((signedTX) => {
    provider.sendTransaction(signedTX).then(console.log);
  });
}

async function stakeGoerliMatic() {
  const contract = '0x748c2370dc892f2a1fc9947b1264ef0fad58b12b';
  // let nonce = await provider.getTransactionCount(wallet.address);

  console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is stakeGoerliMatic `)
  const tx = {
    // 'from': endData[i].split(',')[0],
    'from': wallet.address,
    'to': contract,
    // 'data': '0xb6b55f250000000000000000000000000000000000000000000000008ac7230489e80000', // 10matic
    'data': '0xb6b55f250000000000000000000000000000000000000000000000004563918244f40000', // 5matic
    'nonce': nonce,
    

    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }

  await wallet.signTransaction(tx).then(async (signedTX) => {
    await provider.sendTransaction(signedTX).then(console.log);
  });
  nonce = nonce + 1;
  await wait(transactionWaitMillis);
}

async function unStakeGoerliMatic(index) {
  const contract = '0x748c2370dc892f2a1fc9947b1264ef0fad58b12b';
  // let nonce = await provider.getTransactionCount(wallet.address);

  console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is unStakeGoerliMatic `)
  const tx = {
    // 'from': endData[i].split(',')[0],
    'from': wallet.address,
    'to': contract,
    // 'data': '0x2e1a7d4d00000000000000000000000000000000000000000000000038e62046fb1a0000',
    // 'data': '0x2e1a7d4d'+getRandomUnstakeMatic(),
    'data': '0x2e1a7d4d' + '0000000000000000000000000000000000000000000000004563918244f40000',
    'nonce': nonce,
    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }

  let transactionResOut;
  await wallet.signTransaction(tx).then(async (signedTX) => {
    await provider.sendTransaction(signedTX).then((transactionRes) => {
      console.log(transactionRes);
      transactionResOut = transactionRes;
    });
  });

  await wait(transactionWaitMillis);
  console.log("transactionResOut.hash:" + transactionResOut.hash)

  let transactionReceiptOut;
  await provider.getTransactionReceipt(transactionResOut.hash).then((receipt) => {
    console.log("receipt:" + receipt);
    transactionReceiptOut = receipt;
  });

  // 判断是否上链成功
  if (transactionReceiptOut && transactionReceiptOut.status == 1) {
    console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is unStakeGoerliMatic success`);
    updateAccountwithdrawMaticCountToFile(index);
  } else {
    console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is unStakeGoerliMatic error`);
  }
  nonce = nonce + 1;
}

async function claimGoerliMatic() {
  const contract = '0x11fe0b9b1a408f5d790c6ea5666ee6f31306408f';
  // let nonce = await provider.getTransactionCount(wallet.address);
  console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is mint g matic `)
  const tx = {
    // 'from': endData[i].split(',')[0],
    'from': wallet.address,
    'to': contract,
    'data': '0xdf8de3e7000000000000000000000000499d11e0b6eac7c0593d8fb292dcbbf815fb29ae',
    'nonce': nonce,
    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }

  await wallet.signTransaction(tx).then((signedTX) => {
    provider.sendTransaction(signedTX).then(console.log);
  });

}

function getHexIndex(i) {
  let hexStr = i.toString(16);
  // console.log(hexStr);
  hexStr = padStart(64, hexStr);
  return hexStr;
}

async function claimUnStakeGoerliMatic(index) {
  const contract = '0x748c2370dc892f2a1fc9947b1264ef0fad58b12b';
  // let nonce = await provider.getTransactionCount(wallet.address);

  console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is claimUnStakeGoerliMatic `)
  const tx = {
    // 'from': endData[i].split(',')[0],
    'from': wallet.address,
    'to': contract,
    // 'data': '0x2e1a7d4d00000000000000000000000000000000000000000000000038e62046fb1a0000',
    // 'data': '0x379607f50000000000000000000000000000000000000000000000000000000000000000',
    'data': '0x379607f5' + getHexIndex(userAry[index].claimWithdrawMaticCount),
    'nonce': nonce,
    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }

  let transactionResOut;

  await wallet.signTransaction(tx).then(async (signedTX) => {
    await provider.sendTransaction(signedTX).then((transactionRes) => {
      console.log(transactionRes);
      transactionResOut = transactionRes;
    })
  });

  await wait(transactionWaitMillis);
  console.log("transactionResOut.hash:" + transactionResOut.hash)

  let transactionReceiptOut;
  await provider.getTransactionReceipt(transactionResOut.hash).then((receipt) => {
    console.log("receipt:" + receipt);
    transactionReceiptOut = receipt;
  });
  // 判断是否上链成功
  if (transactionReceiptOut && transactionReceiptOut.status == 1) {
    console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is claimUnStakeGoerliMatic success`);
    updateAccountClaimMaticCountToFile(index, 0);
  } else {
    console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is claimUnStakeGoerliMatic error`);
  }

  nonce = nonce + 1;
}


// 函数实现，参数单位 毫秒 ；
function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};
