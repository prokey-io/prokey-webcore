/* @flow */
'use strict';

import { EnumOutputScriptType, AddressModel } from '../models/Prokey';

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

export const getOutputScriptType = (path?: Array<number>): EnumOutputScriptType => {
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

export function GetListOfBipPath(coinBip44: number, account: number, numberOfAddress: number, isSegwit: boolean, isChange: boolean = false, startIndex: number = 0 ): Array<AddressModel>{
    let paths: Array<AddressModel> = new Array<AddressModel>();
    for(let i = 0; i<numberOfAddress; i++) {

        // m / purpose' / coin_type' / account' / change / address_index
        let pathStr = 'm';
        
        // purpose: Bip44 or 49
        if(isSegwit) {
            pathStr += `/49'`;
        }
        else {
            pathStr += `/44'`;
        }

        // / coin_type' / account'
        pathStr += `/${coinBip44}'/${account}'`;

        // / change
        pathStr += (isChange) ? '/1' : '/0';

        // / address_index
        pathStr += `/${startIndex+i}`;

        let path: AddressModel = {
            path: [ 
                0x80000000 + (isSegwit == true ? 49 : 44),
                0x80000000 + coinBip44,
                0x80000000 + account,
                (isChange) ? 1 : 0,
                startIndex + i,
            ],
            serializedPath: pathStr,
            address: "",
        }

        paths.push(path);
    }
    return paths;
}
