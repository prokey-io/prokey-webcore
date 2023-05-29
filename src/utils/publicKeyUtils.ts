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

import * as crypto from 'crypto';
import * as bs58 from 'bs58';
import * as b58 from 'bs58check';

const prefixes = new Map<string, string>([
    ['xpub', '0488b21e'],
    ['ypub', '049d7cb2'],
    ['Ypub', '0295b43f'],
    ['zpub', '04b24746'],
    ['Zpub', '02aa7ed3'],
    ['tpub', '043587cf'],
    ['upub', '044a5262'],
    ['Upub', '024289ef'],
    ['vpub', '045f1cf6'],
    ['Vpub', '02575483'],
]);

/**
 * To validate Extended Public Key
 * @param key the public key in xpub, ypub or zpub to validate
 * @returns true if valid otherwise false
 */
export function validateBitcoinExtendedPublicKey(key: string): boolean {
    // Prefixes for XPUB, YPUB, and ZPUB keys
    const xpubPrefix = 'xpub';
    const ypubPrefix = 'ypub';
    const zpubPrefix = 'zpub';

    // Check prefix
    const prefix = key.substring(0, 4);
    if (![xpubPrefix, ypubPrefix, zpubPrefix].includes(prefix)) {
        return false;
    }

    // Check length
    if (key.length !== 111) {
        return false;
    }

    // Base58 decoding
    const decodedKey = bs58.decode(key);

    // Checksum validation
    const checksum = decodedKey.slice(-4);
    const keyData = decodedKey.slice(0, -4);
    const doubleHash = crypto.createHash('sha256').update(keyData).digest();
    const checksumVerify = crypto.createHash('sha256').update(doubleHash).digest().slice(0, 4);

    for (let i = 0; i < checksum.length; i++) {
        if (checksum[i] != checksumVerify[i]) return false;
    }

    return true;
}

/**
 * To change the public key version byte like xpub to ypub
 * @param xpub The public key to convert
 * @param targetFormat The target format from @prefixes map
 * @returns The changed version public key
 */
export function changeVersionBytes(xpub: string, targetFormat: string) {
    if (!prefixes.has(targetFormat)) {
        return 'Invalid target version';
    }

    // trim whitespace
    xpub = xpub.trim();

    try {
        // get the data
        var data = b58.decode(xpub);
        // remove the version bytes
        data = data.slice(4);
        // add the new version bytes
        data = Buffer.concat([Buffer.from(prefixes.get(targetFormat) as string, 'hex'), data]);
        // encode back to base58
        return b58.encode(data);
    } catch (err) {
        return "Invalid extended public key! Please double check that you didn't accidentally paste extra data.";
    }
}
