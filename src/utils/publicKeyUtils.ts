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
