/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) 2022 Prokey.io
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

import { RlpEncoding } from "../utils/rlp-encoding"
import { EthereumTx } from "../models/EthereumTx";
import * as ProkeyResponses from '../models/Prokey';

/**
 * A helper function to serialize (RLP encoding) the ethereum transaction
 * @param tx Ethereum Transaction
 * @param signedValues Signature values (r,s and v)
 */
export function SerializeEthereumTx(tx: EthereumTx, signedValues: ProkeyResponses.EthereumSignedTx): string {
    // Encoding transaction
    if(tx.gasPrice != null) {
        return legacyTxRlpEncode(tx, signedValues);
    } else {
        return eip1559TxRlpEncode(tx, signedValues);
    }
}

/**
 * Serialize legacy eth transaction
 * @param tx Ethereum Transaction
 * @param signedValues Signature values (r,s and v)
 * @returns serialized tx
 */
function legacyTxRlpEncode(tx: EthereumTx, signedValues: ProkeyResponses.EthereumSignedTx) {
    let nonce = (tx.nonce == '0' || tx.nonce == '00') ? '' : tx.nonce;
    let value = (tx.value == '0' || tx.value == '00') ? '' : tx.value;
    const { r, s, v } = signedValues;
    let rlp: RlpEncoding = new RlpEncoding();

    const rawTx = [
        '0x' + nonce,
        '0x' + (tx.gasPrice || ''),
        '0x' + (tx.gasLimit || ''),
        '0x' + tx.to.toLowerCase() || '',
        '0x' + value,
        '0x' + (tx.data || '')
    ];

    
    const toEncode = [...rawTx, ...[v, r, s]];
    return '0x' + rlp.encode(toEncode).toString('hex');
}

function eip1559TxRlpEncode(tx: EthereumTx, signedValues: ProkeyResponses.EthereumSignedTx) {
    let nonce = (tx.nonce == '0' || tx.nonce == '00') ? '' : tx.nonce;
    let value = (tx.value == '0' || tx.value == '00') ? '' : tx.value;
    let v = (signedValues.v == '0x0' || signedValues.v == '0x00') ? '' : signedValues.v;
    
    let rlp: RlpEncoding = new RlpEncoding();

    console.log(signedValues);

    const rawTx = [
        '0x' + (tx.chainId || ''),
        '0x' + nonce,
        '0x' + tx.maxPriorityFeePerGas,
        '0x' + tx.maxFeePerGas,
        '0x' + (tx.gasLimit || ''),
        '0x' + tx.to.toLowerCase() || '',
        '0x' + value,
        '0x' + (tx.data || ''),
        []
    ];

    const toEncode = [...rawTx, ...[v, signedValues.r, signedValues.s]];
    return '0x02' + rlp.encode(toEncode).toString('hex');
}