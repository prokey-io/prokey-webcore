var WAValidator = require('multicoin-address-validator');
import { CoinBaseType } from "../../src/coins/CoinInfo";

export function IsAddressValid(address: string, coinType: CoinBaseType, symbol: string, isTest?: boolean): boolean{
    //! these coins are use same address encoding model
    if (coinType == CoinBaseType.ERC20 || coinType == CoinBaseType.EthereumBase) {
        symbol = "ETH";
    } 
    else if (isTest != null && isTest == true){
        if (symbol.substring(0, 1) == 't') {
            symbol = symbol.substring(1);
        }
    }

    if (!WAValidator.findCurrency(symbol)) {
        return false;
    }

    if (isTest != null && isTest == true) {
        if (WAValidator.validate(address, symbol, 'testnet')) {
            return true;
        }
    } else {
        if (WAValidator.validate(address, symbol)) {
            return true;
        }
    }

    return false;
}