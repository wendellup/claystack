const axios = require('axios');
const ethers = require('ethers');
require("dotenv").config();

function getStanding(address) {
    return new Promise(async (resolve, reject) => {
        axios.post('https://api.claystack.com/standing', {
            address: address,
            liveEvents: true
        }).then(res => {
            resolve(res.data);
        }).catch(err => {
            console.log('Error getting standing data')
            reject(err);
        })
    });
}

async function start() {
    let keys = process.env.KEYS.split(",");
    for (let key of keys) {
        let wallet = new ethers.Wallet(key);
        let standing = await getStanding(wallet.address);
        console.log(`Address: ${wallet.address}\nTotal Points:${standing.total_points.toFixed(0)}\nRanking: ${standing.ranking}\nStreak: ${standing.streak}\n==================`)
    }
}

start()