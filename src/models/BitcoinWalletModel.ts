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

import { AddressModel } from "./Prokey";

/**
 * For account discovery, BitcoinAccountAddressReq should be used as starting point
 * @next BitcoinWalletModel
 */
export interface BitcoinDiscoveryWalletReq {
    address: string,
    path?: Array<number> | string,
    publicKey?: string,
    pubkeyIndex?: number,
    isGetUtxo?: boolean,   
}

/**
 * This is the result of account discovery
 * Result of account discovery is a Wallet with total balance and list of AccountInfo
 * @end
 */
export interface BitcoinWalletModel {
    totalBalance: number,
    accounts?: Array<BitcoinAccountInfo>,
}

/**
 * This is a bitcoin account model that can be gotten by Public Key
 */
export interface BitcoinAccountInfo {
    // current page, starting from 1
    page?: number, 
    // total number of pages
    totalPages?: number,
    // number of items on page
    itemsOnPage?: number,
    // the requested address(address/xpub)
    address: string,
    // total current balance per satoshi
    balance: string,
    // total received
    totalReceived: string,
    // total sent
    totalSent: string,
    // the balance which is not confirmed yet
    unconfirmedBalance: string,
    // number of unconfirmed transactions
    unconfirmedTxs: number;
    // total number of transactions
    txs: number;
    // list of transactions
    transactions?: BitcoinTransactionInfoModel[];
    // list of transactions' ids(hash)
    txids?: string[];
    // number of tokens
    usedTokens: number;
    // list of tokens
    tokens?: BitcoinTokenModel[];
    //--------------------------
    // Additional information
    //--------------------------
    // account index
    accountIndex?: number,
    // list of addresses
    addresses?: AddressModel[];
    // list of change addresses
    changeAddresses?: AddressModel[];
    // the public key and path to this account
    publicKey?: AddressModel,
    // List of unspent transactions (UTXO)
    sortedUtxos?: BitcoinUtxoModel[],
    // The last unused address
    lastUnusedAddress?: AddressModel;
}

/**
 * A Bitcoin Transaction model in blockchain
 */
export interface BitcoinTransactionInfoModel {
    // hash of transaction
    txid: string,
    // transaction version
    version?: number,
    // locktime
    lockTime?: number,
    // list of inputs
    vin: Array<BitcoinTransactionInputModel>,
    // list of outputs
    vout: Array<BitcoinTransactionOutputModel>,
    // hash of the block in which this transaction exist
    blockHash: string,
    // the block number in which this transaction exist
    blockHeight: number,
    // number of confirmations (lastBlockNumber - blockHeight)
    confirmations: number,
    // the time of block in which this transaction exist
    blockTime: number,
    // sum of output values
    value: string,
    // sum of input values
    valueIn: string,
    // transaction fee
    fees: string,
    // the transaction in raw
    hex: string
}

/**
 * Transaction input model
 */
export interface BitcoinTransactionInputModel {
    // transaction hash 
    txid?: string;
    // sequence number
    sequence?: any;
    // index of this input!
    n: number;
    // list of address
    addresses: string[];
    // true if addresses contains an actual address
    // false if OP_RETURN of sth else
    isAddress: boolean;
    // value of this input 
    value: string;
    // the previous output(script) in raw hex
    hex?: string;
    // previous output index (if null, vout = 0)
    vout?: number;
}

/**
 * Transaction output model
 */
export interface BitcoinTransactionOutputModel {
    // value to be sent
    value: string,
    // index of this output
    n: number,
    // output script in raw hex
    hex?: string,
    // receivers address
    addresses: string[],
    // true: if addresses contains an actual address
    // false: if OP_RETURN of sth else
    isAddress: boolean,
    // true: if this output already spent
    spent?: boolean
}

/**
 * Bitcoin token(somehow address) model
 */
export interface BitcoinTokenModel {
    // type of this token
    type: string;
    // name (the address)
    name: string;
    // BIP32 path to this address
    path: string;
    // number of transactions
    transfers: number;
    // decimals
    decimals: number;
    // current balance of this address
    balance: string;
    // total amount this address received
    totalReceived: string;
    // total amount this address sent
    totalSent: string;
}

/**
 * Information about an address in blockchain
 */
export interface BitcoinAddressInfoModel {
    // specifies page
    page: number,
    // total number of pages
    totalPages: number,
    // number of items on a page
    itemsOnPage: number,
    // the address itself
    address: string,
    // current balance of this address
    balance: string,
    // total amount this address received
    totalReceived: string,
    // total amount this address sent
    totalSent: string,
    // the balance which is not confirmed yet
    unconfirmedBalance: string,
    // number of unconfirmed transactions
    unconfirmedTxs: number,
    // number of transactions
    txs: number,
    // hash of all transactions
    txids?: string[]
    // list of transactions
    transactions?: BitcoinTransactionInfoModel[];
    //--------------------------
    // Additional information
    //--------------------------
    addressModel?: AddressModel;
}

/**
 * bitcoin transaction data in the exact format as returned by backend
 */
export interface BitcoinTransactionDetailInfoModel {
    // transaction id
    txid: string,
    // hash
    hash: string,
    // version
    version: number,
    // size in bytes
    size: number,
    // virtual size
    vsize: number,
    // weight
    weight: number,    
    // locktime
    locktime: number,
    // list of inputs
    vin: BitcoinTransactionInputDetailModel[],
    // list of outputs
    vout: BitcoinTransactionOutputDetailModel[],
    // transaction in raw
    hex: string,
    // hash of the block in which this transaction exist
    blockhash: string,
    // number of confirmations (lastBlockNumber - blockHeight) 
    confirmations: number,
    // time
    time: number,
    // blocktime
    blocktime: number
}

/**
 * Bitcoin transaction input in details, in the exact format as returned by backend
 */
export interface BitcoinTransactionInputDetailModel {
    // transaction id
    txid: string,
    // previous output index 
    vout: number,
    // script sig
    scriptSig: {
        // asm 
        asm: string,
        // hex 
        hex: string
    },
    // witness (signature)
    txinwitness: Array<string>,
    // sequence number
    sequence: number
}

/**
 * Bitcoin transaction output in details, in the exact format as returned by backend
 */
export interface BitcoinTransactionOutputDetailModel {
    // Value sent
    value: number,
    // index of this output
    n: number,
    // out script
    scriptPubKey: {
        // script in asm
        asm: string,
        // script in hex
        hex: string,
        // serialized address, null if not an address
        address?: string,
        // type of script output
        //    - pubkeyhash  
        //    - scripthash
        //    - witness_v0_keyhash
        //    - nulldata when the script is unknown or OP_RETURN
        type: string
    }
}

/**
 * Bitcoin utxo (unspent transaction) model
 */
 export interface BitcoinUtxoModel {
    // transaction id
    txid: string,
    // prev. output index
    vout: number,
    // prev. output value
    value: string,
    // block height
    height: number,
    // number of confirmations (lastBlockNumber - blockHeight)
    confirmations: number,
    // address (if req by xpub)
    address?: string,
    // path to the address (if req by xpub)
    path?: string
}

export interface BitcoinFee {
    economy: number,
    normal: number,
    high: number,
}

export interface BitcoinTransactionView {
    hash: string,
    blockNumber: number,
    date: string,
    received?: Array<BitcoinReceivedView>,
    sent?: Array<BitcoinSentView>,
    fee?: number
    isOmni: boolean,
}

export interface BitcoinReceivedView {
    value: number,
    address: string,
    status: 'RECEIVED' |'RECEIVED_FROM_OWN' | 'OMNI_RECEIVED' | 'OMNI_CHANGE',
}

export interface BitcoinSentView {
    value: number,
    address: string,
    status: 'SENT' | 'SENT_TO_OWN' | 'OMNI_CHANGE' | 'OMNI_SENT',
}
