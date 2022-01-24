const ethers = require('ethers');
require("dotenv").config();
const fs = require('fs');
const axios = require('axios')

const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/21521d3bc5f24eea8df0e5f2dbd29592");

let keys = process.env.KEYS.split(",");
const INTERVAL = 60 * 24;//Run every 1 minute
const args = process.argv.slice(2)
let toFinishPrivateKey = keys[args[0]];
let transactionWaitMillis = 30000;

// let toFinishPrivateKey =  process.env.toFinishPrivateKey;
// let toFinishPrivateKey =  keys[32];

let wallet = new ethers.Wallet(toFinishPrivateKey, provider);
let signer = wallet.connect(provider);
let nonce = 0;
// start();
let okAray = ['a', 1]
console.log(okAray.includes(1));

console.log("0 in okAray:" + (0 in okAray));

function updateAccountClaimMaticCountToFile(index, num){
  if(num==0){
    let rawdata = fs.readFileSync('accountStatus.json');
    let accountStatus = JSON.parse(rawdata);
    accountStatus[index].claimWithdrawMaticCount = 1 + accountStatus[index].claimWithdrawMaticCount;
    let data = JSON.stringify(accountStatus);
    fs.writeFileSync('accountStatus.json', data);
  }else{
    let rawdata = fs.readFileSync('accountStatus.json');
    let accountStatus = JSON.parse(rawdata);
    accountStatus[index].claimWithdrawMaticCount = num;
    let data = JSON.stringify(accountStatus);
    fs.writeFileSync('accountStatus.json', data);
  } 
}

function initAccountStatusToFile(accountStatus){
  let data = JSON.stringify(accountStatus);
  fs.writeFileSync('accountStatus.json', data);
}

function loadAccountStatusFromFile(){
  let rawdata = fs.readFileSync('accountStatus.json');
  let accountStatus = JSON.parse(rawdata);
  return accountStatus;
}



// function updateAccountWithdrawMaticCountToFile(index){
//   let rawdata = fs.readFileSync('accountStatus.json');
//   let accountStatus = JSON.parse(rawdata);
//   accountStatus.data[index].withdrawMaticCount = 1 + accountStatus.data[index].withdrawMaticCount?0:accountStatus.data[index].withdrawMaticCount;
//   let data = JSON.stringify(accountStatus);
//   fs.writeFileSync('accountStatus.json', data);
// }




// 1. 提交的transaction是否执行成功, 如何判断
// 2. 从etherscan获取执行withdraw成功的次数, 和claim次数, 全量跑一边,并更新数据到accountStatus.json
let address = "0x3c3bd5Af6d4a41390B560eC266a4310D9D90888c";



function filterWithDraw(item) {
  if(item.isError=="1"){
    return false;
  }
  if(!item.input.startsWith("0x2e1a7d4d")){
    return false;
  }
  return true;
}


function filterClaim(item) {
  if(item.isError=="1"){
    return false;
  }
  if(!item.input.startsWith("0x379607f5")){
    return false;
  }
  return true;
}

let userAry = [];

runLoop();
async function runLoop() {
  
  userAry = loadAccountStatusFromFile();
  console.log(userAry.length)
  await loopUpdate();

  // console.log(getHexIndex(15));

  // initAccountStatusToFile(userAry);


  // setInterval(function () {
  //   // loop();
  // }, (INTERVAL + 3) * 60 * 1000)
}

// let keys = process.env.KEYS.split(",");
// for (let key of keys) {



function createUser(index, withDrawNum, claimNum, address){
  let user = {
    "index": index,
    "id": index+1,
    "address":address,
    "withdrawMaticCount":withDrawNum,
    "claimWithdrawMaticCount":claimNum
  }
  return user;
}

async function loopUpdate() {
  for (let i = 0; i < keys.length; i++) {
    // if(i>userAry.length){
    if(i==0){
      continue;
    }

      if(userAry[i].withdrawMaticCount==0){
        continue;
      }  
      

      if(userAry[i].withdrawMaticCount>0){
        toFinishPrivateKey = keys[i];
        wallet = new ethers.Wallet(toFinishPrivateKey, provider);
        console.log(`handler:${i }`);
        nonce = await provider.getTransactionCount(wallet.address);
        console.log(`Now nonce is ${nonce}`)
        for(let j=0; j<userAry[i].withdrawMaticCount;j++){
          await claimUnStakeGoerliMatic(i,j)
        }
      }
      

  }
}

async function loopInitClaimWithdrawMaticCount() {
  for (let i = 0; i < keys.length; i++) {
    if(i>userAry.length){
      return;
    }

      if(userAry[i].withdrawMaticCount==0){
        continue;
      }  

      if(userAry[i].withdrawMaticCount>0){
        console.log(`handler:${i }`);
        // for(let j=0; j<withdrawMaticCount;j++){
        //   await claimUnStakeGoerliMatic(i,j)
        // }
      }
      let data;
      toFinishPrivateKey = keys[i];
      wallet = new ethers.Wallet(toFinishPrivateKey, provider);
        
      await axios.post(`https://api-goerli.etherscan.io/api?module=account&action=txlist&contractaddress=0x748c2370dc892f2a1fc9947b1264ef0fad58b12b&address=${wallet.address}&page=1&offset=2000&sort=desc&apikey=B95WUIM36J7WKTB339P1Q3CJD8RYNUQVB2`).then(res => {
        console.log("res.data.message:"+res.data.message);
        
        console.log("res.status:"+res.status);
        data = res.data;
        
      })
      .catch(err => {
        console.log(err);
      });
    
      var res = data.result.filter(filterClaim);
      console.log(`${wallet.address} filterClaim len:${res.length}`);

      // userAry.push(createUser(i,res.length,0,wallet.address));
      updateAccountClaimMaticCountToFile(i,res.length);
      // console.log(JSON.stringify(userAry));
    // if (okAray.includes(i + 1)) {
    //   console.log(`handler:${i + 1}`);
    //   try {
    //     toFinishPrivateKey = keys[i];
    //     wallet = new ethers.Wallet(toFinishPrivateKey, provider);
    //     signer = wallet.connect(provider);
    //     await start(i);
    //   } catch (error) {
    //     console.log(error);
    //   }

    // }

  }
}





// 函数实现，参数单位 毫秒 ；
function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

async function start(index) {

  nonce = await provider.getTransactionCount(wallet.address);
  console.log(`Now nonce is ${nonce}`)

  // let transactionHash = "0xe37323ed00e2615f069388f5d7bd13ee782734d597251d1b00570b2e7b73512e";

  // let transactionHash2 = "0xca5c0bd3b3bdbe421a087697a57e1b2102a2898d313eb9e254f564a898a12010";



  // await provider.getTransactionReceipt (transactionHash).then((transaction)=>{
  //   console.log(transaction);
  // });

  // await provider.getTransactionReceipt (transactionHash2).then((transaction)=>{
  //   console.log(transaction);
  // });

  // await provider.getTransactionReceipt(transactionHash).then((receipt) => {
  //   console.log(receipt);
  // });


  // await claimGoerliMatic();
  // await wait(26000);
  // nonce= nonce+1;

  // await approveGoerliMatic()
  // await wait(20000);
  // nonce= nonce+1;

  // await  stakeGoerliMatic();
  // await wait(20000);
  // nonce= nonce+1;

  // await unStakeGoerliMatic();
  // await wait(10000);
  // nonce= nonce+1;

  // await claimUnStakeGoerliMatic(index)

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

function getHexIndex(i) {
  let hexStr = i.toString(16);
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
    'data': '0xb6b55f250000000000000000000000000000000000000000000000008ac7230489e80000',
    'nonce': nonce,
    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }

  await wallet.signTransaction(tx).then((signedTX) => {
    provider.sendTransaction(signedTX).then(console.log);
  });
}

async function unStakeGoerliMatic() {
  const contract = '0x748c2370dc892f2a1fc9947b1264ef0fad58b12b';
  // let nonce = await provider.getTransactionCount(wallet.address);

  console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is unStakeGoerliMatic `)
  const tx = {
    // 'from': endData[i].split(',')[0],
    'from': wallet.address,
    'to': contract,
    // 'data': '0x2e1a7d4d00000000000000000000000000000000000000000000000038e62046fb1a0000',
    'data': '0x2e1a7d4d' + getRandomUnstakeMatic(),
    'nonce': nonce,
    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }

  await wallet.signTransaction(tx).then((signedTX) => {
    provider.sendTransaction(signedTX).then(console.log);
  }

  );
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

async function claimUnStakeGoerliMatic(index, claimIndex) {
  const contract = '0x748c2370dc892f2a1fc9947b1264ef0fad58b12b';
  // let nonce = await provider.getTransactionCount(wallet.address);

  console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is claimUnStakeGoerliMatic `)
  const tx = {
    // 'from': endData[i].split(',')[0],
    'from': wallet.address,
    'to': contract,
    // 'data': '0x379607f50000000000000000000000000000000000000000000000000000000000000000',
    'data': '0x379607f5'+ getHexIndex(claimIndex),
    'nonce': nonce,
    'gasLimit': 10000000,
    'gasPrice': await provider.getGasPrice()
  }
  let transactionResOut;

  await wallet.signTransaction(tx).then(async (signedTX) => {
     await provider.sendTransaction(signedTX).then((transactionRes) => {
      console.log(transactionRes);
      transactionResOut= transactionRes;
    })
  });
  
  await wait(transactionWaitMillis);
  console.log("transactionResOut.hash:"+transactionResOut.hash)

  let transactionReceiptOut;
  await provider.getTransactionReceipt(transactionResOut.hash).then((receipt) => {
    console.log("receipt:"+receipt);
    transactionReceiptOut = receipt;
  });
  // 判断是否上链成功
  if(transactionReceiptOut && transactionReceiptOut.status==1){
    console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is claimUnStakeGoerliMatic success`);
    updateAccountClaimMaticCountToFile(index,0);
  }else{
    console.log(`Now address is ${wallet.address}, nonce is ${nonce}, It is claimUnStakeGoerliMatic error`);
  }

  nonce = nonce + 1;
}

async function sendSignTransaction(tx, wallet) {
  // return greeting = await Promise.resolve("Hello");
  await wallet.signTransaction(tx).then((signedTX) => {
    provider.sendTransaction(signedTX).then((transactionRes) => {
      console.log(transactionRes);
      
      return transactionRes;
    })
  });

};


// 函数实现，参数单位 毫秒 ；
function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};
