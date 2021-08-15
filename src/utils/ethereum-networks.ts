/**
* Get network by chainId
* @param chainId 
*/
export function GetNetworkByChainId(chainId: number): string {
   switch(chainId) {
       case 1:
           return 'eth';       // Ethereum Mainnet
       case 2:
           return 'exp';       // Expanse Network	
       case 3:
           return 'ropsten'    // Ethereum Testnet Ropsten
       case 4:
           return 'trin';      // Ethereum Testnet Rinkeby
       case 5:
           return 'goerli';    // Ethereum Testnet Görli
       case 8:
           return 'ubq';       // Ubiq Network Mainnet
       case 42:
           return 'kovan';     // Ethereum Testnet Kovan
       case 56:
           return 'bsc';       // Binance Smart Chain
       case 61:
           return 'etc';       // Ethereum Classic Mainnet
       case 64:
           return 'ella';      // Ellaism
       case 31102:
           return 'ESN';       // Ethersocial Network
       default:
           return ''
   }
}