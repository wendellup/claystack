# ClayStack - Collect to access Malawi testnet
## How to use:

### Setting up
* git clone https://github.com/ericet/claystack.git
* npm install
* mv .env.example .env
* Put your private key(keys) into KEYS field. Eg: KEYS=0x00000000,0x11111111,0x222222222
* If you want to collect all tokens from different accounts into one single account. Put your receipient address into TO field. Eg: TO=0x9999999


### Auto Claiming the package
* `node claim.js` 


### Collect tokens from different account into one account
* `node collectAll.js`
