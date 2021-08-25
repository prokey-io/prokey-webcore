/**
* Get network by chainId
* @param chainId Chain ID
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
       case 30:
           return 'rsk';       // RSK
       case 31:
           return 'trsk';      // RSK Testnet
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
           return chainId.toString();
   }
}

/**
 * Return the full name of Network, usually this uses in UI
 * @param chainId Chain ID
 */
export function GetNetworkFullNameByChainId(chainId: number){
    switch(chainId) {
        case 1:
            return 'Ethereum';                  // Ethereum Mainnet
        case 2:
            return 'Expanse';                   // Expanse Network	
        case 3:
            return 'Ethereum Testnet Ropsten';  // Ethereum Testnet Ropsten
        case 4:
            return 'Ethereum Testnet Rinkeby';  // Ethereum Testnet Rinkeby
        case 5:
            return 'Ethereum Testnet Gorli';    // Ethereum Testnet Görli
        case 8:
            return 'Ubiq';                      // Ubiq Network Mainnet
        case 30:
            return 'RSK';                       // RSK
        case 31:
            return 'RSK Testnet';               // RSK Testnet
        case 42:
            return 'Ethereum Testnet Kovan';    // Ethereum Testnet Kovan
        case 56:
            return 'Binance Smart Chain';       // Binance Smart Chain
        case 61:
            return 'Ethereum Classic';          // Ethereum Classic Mainnet
        case 64:
            return 'Ellaism';                   // Ellaism
        case 31102:
            return 'Ethersocial';               // Ethersocial Network
        default:
            return ''
    }
}