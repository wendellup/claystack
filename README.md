# ClayStack - Collect to access Malawi testnet
## How to use:

### Setting up
* git clone https://github.com/ericet/claystack.git
* npm install
* mv .env.example .env
* Put your private key(keys) into KEYS field. Eg: KEYS=000000000,011111111,0222222222
* If you want to collect all tokens from different accounts into one single account. Put your receipient address into TO field. Eg: TO=0x9999999


### Auto Claiming the package
* `node claim.js` 


### Collect tokens from different account into one account
* `node collectAll.js`

If you find this script is useful to you, donation will be appreciated: **0x434DCffCF7dABd48B284860C27ebd184C91341F5**

---
## 设置
* git clone https://github.com/ericet/claystack.git
* npm install
* 文件改名
  * mv .env.example .env
* 把私钥放在.env 文件里面的KEYS后面。比如：KEYS=000000000,011111111,0222222222
* 如果你想把其他钱包里面的手镯归集到一个账号，TO后面填入要归集到的钱包地址。比如TO=0x9999999

## 运行自动领取程序
node claim.js

## 运行归集程序
node collectAll.js

如果你觉得脚本帮助到你，可以捐献一点心意。钱包地址：**0x434DCffCF7dABd48B284860C27ebd184C91341F5**, 各链通用. 谢谢！
