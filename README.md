# prokey-webcore
This is an all-in-one platform/library to use Prokey Hardware Wallet. 

By using this library you will be able to implement these functionalities to your application straightforward:
- Account discovery
- List of transactions
- Generate a transaction
- Broadcast a transaction to the network
- Get Address
- Get public key
- Access to Wallet Settings
- etc

## How to add?
It is recommended to add this repository main branch to your project as a submodule.

  After adding, you need to run 'npm install' in the root directory of this module in order to install all prerequisites.

## Supported Coins
 - Bitcoin based coins Like Bitcoin, Litecoin, Bitcoincash, Doge, Bitcoin Gold
 - Ethereum
 - ERC20
 - OMNI Protocol tokens based on Bitcoin Blockchain
 - Ripple

## Sample code
 - First thing first, you need to create an instance of Prokey Device. 
 
 `We assume that the current path to this library is 'lib/prokey-webcore'`
 
 ```
 import { Device } from 'lib/prokey-webcore/src/device/Device'
 
 ...
 let device = new Device((success) => {
  if(!success)
    console.log("Can not load resource files");
 });
 ```
 
 - Connecting to the Device
  
  Due to WebUsb security, the USB devices are only accessible in secure HTTPS context or localhost.
  Please aware that some of the web browsers still do not support WebUsb.
  
  ```
  let res = await device.TransportConnect();
  if(res.success == false){
    console.log("Can not connect to device", res);
  }
  ```
  
  Due to WebUsb security reason, this function, TransportConnect, have to be called from a UI component like a Button.
  
  By calling the TransportConnect function, the webUsb will be initialized and the browser shows a list of available devices. The user should select the device to connect.
  
  - Get a bitcoin address
  
  ```
   import { Device } from 'lib/prokey-webcore/src/device/Device'
   import { BitcoinCommands } from 'lib/prokey-webcore/src/device/BitcoinCommands'
   import * as Util from 'lib/prokey-webcore/src/utils/pathUtil'
   import { CoinBaseType } from "lib/prokey-webcore/src/coins/CoinInfo";
   import { GeneralCoinInfoModel, BitcoinBaseCoinInfoModel } from 'lib/prokey-webcore/src/models/CoinInfoModel'
   import { CoinInfo } from 'lib/prokey-webcore/src/coins/CoinInfo'
   
   
   ...
   
   let btcCommands = new BitcoinCommands();
   
   const coinInfo = CoinInfo.Get<BitcoinBaseCoinInfoModel>('Bitcoin', CoinBaseType.BitcoinBase );
   
   // Getting path to the desire address using a helper function
   let pathModel = Util.GetBipPath(
                          CoinBaseType.BitcoinBase, // CoinType
                          0,  // Account
                          coinInfo, // CoinInfo model, This model is mandatory for Bitcoin-based, Ethereum-Based and Ripple
                          false, // Change address
                          0 // Address Index
                          );
   
   let addressModel = btcCommands.GetAddress( device, pathModel.path, true ); 
   
   console.log('First HD wallet Bitcoin Address', addressModel.address );
   
  ```
  
  - Get Public key
  
  ```
  ...
  // for pathModel.path, check GetAddress
  // Getting path to the desire public key using a helper function
  let pathModel = Util.GetBipPath(
                          CoinBaseType.BitcoinBase, // CoinType
                          0,  // Account
                          coinInfo, // CoinInfo model, This model is mandatory for Bitcoin-based, Ethereum-Based and Ripple
                          ); 
                          
  let publicKeyModel = btcCommands.GetPublicKey( device, pathModel.path, true );
  
  console.log('XPUB:', publicKeyModel.xpub );
  ```
  
  ## Backend Servers(Blockchain)
  
  `Prokey.io has its own dedicated backend private servers which developed from scratch to access to the blockchain. THESE SERVERS ARE NOT AVAILABLE TO OTHER 3D PARTIES/PROJECTS/WEBSITES.`
  
  ## License
   GNU General Public License version 3.0
  
  
