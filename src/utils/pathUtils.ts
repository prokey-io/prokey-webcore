/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
 * Hadi Robati, hadi@prokey.io
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* @flow */
'use strict';

import { 
    EnumOutputScriptType, 
    AddressModel, 
    EnumInputScriptType 
} from '../models/Prokey';

import { CoinBaseType } from "../coins/CoinInfo";

import {
    GeneralCoinInfoModel,
    BitcoinBaseCoinInfoModel,
    EthereumBaseCoinInfoModel,
    RippleCoinInfoModel,
    TronCoinInfoModel,
} from '../models/CoinInfoModel'


export const HD_HARDENED = 0x80000000;
export const toHardened = (n: number): number => (n | HD_HARDENED) >>> 0;
export const fromHardened = (n: number): number => (n & ~HD_HARDENED) >>> 0;

export const invalidParameter = (msg: string): void => {

};

const PATH_NOT_VALID = invalidParameter('Not a valid path.');
const PATH_NEGATIVE_VALUES = invalidParameter('Path cannot contain negative values.');

export const getHDPath = (path: string): Array<number> => {
    const parts: Array<string> = path.toLowerCase().split('/');
    if (parts[0] !== 'm') {
        throw PATH_NOT_VALID;
    }

    return parts.filter((p: string) => p !== 'm' && p !== '')
        .map((p: string) => {
            let hardened = false;
            if (p.substr(p.length - 1) === "'") {
                hardened = true;
                p = p.substr(0, p.length - 1);
            }
            let n: number = parseInt(p, 10);
            if (isNaN(n)) {
                throw PATH_NOT_VALID;
            } else if (n < 0) {
                throw PATH_NEGATIVE_VALUES;
            }
            if (hardened) { // hardened index
                n = toHardened(n);
            }
            return n;
        });
};

export function IsSegwitPath(path: Array<number> | any): boolean  {
    return Array.isArray(path) && path[0] === toHardened(49);
};

export const validatePath = (path: string | Array<number>, length: number = 0, base: boolean = false): Array<number> => {
    let valid: Array<number> = [];
    if (typeof path === 'string') {
        valid = getHDPath(path);
    } else if (Array.isArray(path)) {
        valid = path.map((p: any) => {
            const n: number = parseInt(p, 10);
            if (isNaN(n)) {
                throw PATH_NOT_VALID;
            } else if (n < 0) {
                throw PATH_NEGATIVE_VALUES;
            }
            return n;
        });
    }

    if (!valid) {
        throw PATH_NOT_VALID;
    }

    if (length > 0 && valid.length < length) {
        throw PATH_NOT_VALID;
    }
    return base ? valid.splice(0, 3) : valid;
};

export function getSerializedPath(path: Array<number>): string {
    return path.map((i) => {
        const s = (i & ~HD_HARDENED).toString();
        if (i & HD_HARDENED) {
            return s + "'";
        } else {
            return s;
        }
    }).join('/');
}

export const getPathFromIndex = (bip44purpose: number, bip44cointype: number, index: number): Array<number> => {
    return [
        toHardened(bip44purpose),
        toHardened(bip44cointype),
        toHardened(index),
    ];
};

export function getIndexFromPath(path: Array<number>): number {
    if (path.length < 3) {
        throw invalidParameter(`getIndexFromPath: invalid path length ${path.toString()}`);
    }
    return fromHardened(path[2]);
}

// export const getAccountLabel = (path: Array<number>, coinInfo: CoinInfo): string => {
//     const coinLabel: string = coinInfo.label;
//     const p1: number = fromHardened(path[0]);
//     const account: number = fromHardened(path[2]);
//     const realAccountId: number = account + 1;
//     const prefix = 'Export info of';
//     let accountType = '';

//     if (p1 === 48) {
//         accountType = `${coinLabel} multisig`;
//     } else if (p1 === 44 && coinInfo.segwit) {
//         accountType = `${coinLabel} legacy`;
//     } else {
//         accountType = coinLabel;
//     }
//     return `${prefix} ${accountType} <span>account #${realAccountId}</span>`;
// };


// export const getLabel = (label: string, coinInfo: CoinInfo): string => {
//     if (coinInfo) {
//         return label.replace('#NETWORK', coinInfo.label);
//     }
//     return label.replace('#NETWORK', '');
// };

export function GetScriptType(path?: Array<number>): EnumInputScriptType {
    if (!Array.isArray(path) || path.length < 1){ 
        return EnumInputScriptType.SPENDADDRESS;
    }

    const p1 = fromHardened(path[0]);
    switch (p1) {
        case 48:
            return EnumInputScriptType.SPENDMULTISIG;
        case 49:
            return EnumInputScriptType.SPENDP2SHWITNESS;
        case 84:
            return EnumInputScriptType.SPENDWITNESS;
        default:
            return EnumInputScriptType.SPENDADDRESS;
    }
};

export function GetOutputScriptType(path?: Array<number>): EnumOutputScriptType {
    if (!Array.isArray(path) || path.length < 1) 
        return EnumOutputScriptType.PAYTOADDRESS;
    const p = fromHardened(path[0]);
    switch (p) {
        case 48:
            return EnumOutputScriptType.PAYTOMULTISIG;
        case 49:
            return EnumOutputScriptType.PAYTOP2SHWITNESS;
        case 84:
            return EnumOutputScriptType.PAYTOWITNESS;
        default:
            return EnumOutputScriptType.PAYTOADDRESS;
    }
};

/**
 * Will return BIP Path based on the coin type and parameters. The number of parameters can be vary and depends on the coin type.
 * @param coinType Should be one of the CoinBaseType
 * @param account Account Number, This is mandatory parameters for all coins except Ethereum in case you want to get PublicKey path
 * @param coinInfo This parameter is mandatory for Bitcoin-based, Ethereum-Based and Ripple
 * @param isChange Only needed for Bitcoin-Based
 * @param startIndex Only needed for Bitcoin-Based
 * @returns AddressModel
 */
export function GetBipPath(coinType: CoinBaseType, account?: number, coinInfo?: GeneralCoinInfoModel, isChange?: boolean, startIndex?: number ): AddressModel {
    // Each coin uses BIP44 path schema, For Bitcoin like coins which have UTXO, all 5 parts should be
    // available. But for the account-based coins the path could be different and unfortunately
    // there is no specific standards that all the wallet follow and there are many exceptions here.

    // BIP44 path is:
    // For UTXO-based coins (like Bitcoin, Bitcoin cash, Litecoin and etc) we use:
    //   m / purpose'(44 or 49) / coin_type' / account' / change / address_index

    // For account-based coins (like Stellar, NEM and etc) we use:
    // Stellar's SEP-0005
    //   m / 44' / coin_type' / account'

    // EXCEPTIONS: 
    // There are some exception here that we need to follow for compatibility reasons with other wallets/tools.
    //   Ethereum: To be compatible with tools like MEW and Metamask we use:
    //     m / 44' / coin_type' / 0' / 0 / account'
    //   Ripple: To be compatible with other Hardware wallets, we use:
    //     m / 44' / 144' / account' / 0 / 0

    switch(coinType){
        // m / purpose' / coin_type' / account' / change / address_index
        case CoinBaseType.BitcoinBase:
        {
            if(coinInfo == null) {
                throw new Error("pathUtils::GetBipPath->For Bitcoin-based, coinInfo can not be null");
            }

            //! For getting publicKey, both isChange and startIndex should be null
            if(isChange == null && startIndex != null) {
                throw new Error("pathUtils::GetBipPath->For Bitcoin-based, isChange can not be null");
            }

            if(startIndex == null && isChange != null) {
                throw new Error("pathUtils::GetBipPath->For Bitcoin-based, startIndex can not be null")
            }

            if(account == null) {
                throw new Error("pathUtils::GetBipPath->For Bitcoin-based, account can not be null")
            }

            let ci = coinInfo as BitcoinBaseCoinInfoModel;
            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + ((ci.segwit) ? 49 : 44),   // purpose'
                    HD_HARDENED + ci.slip44,                 // coin_type'
                    HD_HARDENED + account,                   // account'
                ]
            }

            // For getting Public Key isChange should be null
            if(isChange != null){
                path.path.push((isChange == true) ? 1 : 0);
            }

            // For getting Public Key startIndex should be null
            if(startIndex != null) {
                path.path.push(startIndex);
            }
            
            return path;
        }
        // m / purpose' / coin_type' / 0' / 0 / account
        case CoinBaseType.EthereumBase:
        {
            if(coinInfo == null) {
                throw new Error("pathUtils::GetBipPath->For Ethereum, coinInfo can not be null")
            }

            let ci = coinInfo as EthereumBaseCoinInfoModel;
            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + 44,        // purpose'
                    HD_HARDENED + ci.slip44, // coin_type'
                    HD_HARDENED,             // 0' as account
                    0                       // No change
                ]
            }

            // For getting Public Key the account should be null
            if(account != null) {
                path.path.push(account);
            }
            
            return path;
        }
        // m / purpose' / 0' / 0' / 0 / account
        case CoinBaseType.OMNI:
        {
            if(account == null) {
                throw new Error("pathUtils::GetBipPath->For Omni, account can not be null")
            }

            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + 49,    // Segwit
                    HD_HARDENED,         // Bitcoin coin_type is 0
                    HD_HARDENED,         // 0' for account
                    0,                  // no change
                    account
                ]
            }
            
            return path;
        }
        // m / purpose' / coin_type' / account' / 0 / 0
        case CoinBaseType.Ripple:
        {
            if(account == null) {
                throw new Error("pathUtils::GetBipPath->For Ripple, account can not be null")
            }

            if(coinInfo == null) {
                throw new Error("pathUtils::GetBipPath->For Ripple, coinInfo can not be null")
            }

            const ci = coinInfo as RippleCoinInfoModel;

            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + 44,        // BIP44
                    HD_HARDENED + ci.slip44, // Ripple mainnet coin_type is 144 and testnet is 1
                    HD_HARDENED + account,   // account
                    0,
                    0
                ]
            }
            
            return path;
        }
        // m / purpose' / coin_type' / 0' / 0 / account
        case CoinBaseType.ERC20:
        {
            if(account == null) {
                throw new Error("pathUtils::GetBipPath->For ERC20, account can not be null")
            }

            if(coinInfo == null) {
                throw new Error("pathUtils::GetBipPath->For ERC20, coinInfo can not be null")
            }

            let ci = coinInfo as EthereumBaseCoinInfoModel;

            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + 44,        // purpose'
                    HD_HARDENED + ci.slip44, // coin_type' 
                    HD_HARDENED,             // 0' for account
                    0,                      // No change
                    account                 // account
                ]
            }
            
            return path;
        }
        // m / purpose' / coin_type' / account'
        case CoinBaseType.NEM:
        {
            if(account == null) {
                throw new Error("pathUtils::GetBipPath->For NEM, account can not be null")
            }

            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + 44,        // BIP44
                    HD_HARDENED + 43,        // coin_type' 
                    HD_HARDENED + account,   // account'
                ]
            }
            
            return path;       
        }
        // m / purpose' / coin_type' / account'
        case CoinBaseType.Stellar:
        {
            if(account == null) {
                throw new Error("pathUtils::GetBipPath->For Stellar, account can not be null")
            }

            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + 44,        // BIP44
                    HD_HARDENED + 148,       // coin_type'
                    HD_HARDENED + account,   // account'
                ]
            }
            
            return path;       
        }
        case CoinBaseType.Tron:
        {
            if(account == null) {
                throw new Error("pathUtils::GetBipPath->For Tron, account can not be null")
            }

            if(coinInfo == null) {
                throw new Error("pathUtils::GetBipPath->For Tron, coinInfo can not be null")
            }

            const ci = coinInfo as TronCoinInfoModel;

            let path = <AddressModel>{
                address: "",
                path: [
                    HD_HARDENED + 44,        // BIP44
                    HD_HARDENED + ci.slip44, // Tron mainnet coin_type is 195 and testnet is 1
                    HD_HARDENED + account,   // account
                    0,                       // transparent: for transparent addresses, transparent is set 1; for the shielded addresses, transparent is set 0; https://github.com/tronprotocol/tips/issues/102
                    0   
                ]
            }
            
            return path;
        }
        default:
        {
            throw new Error("pathUtil::GetBipPath->Undefined coin type")   
        }
    }
}
