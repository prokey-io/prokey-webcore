/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
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
 * Each wallet contains a list of accounts
 * Most of the times there are just one account
 * 
 * Result of account discovery is total account balance and list of Addresses with all info
 */
export interface BitcoinAccountInfo {
    balance: number,
    accountIndex: number,
    isDiscoveryFinished: boolean,
    addresses: Array<BitcoinAddressInfo>,
    changeAddresses: Array<BitcoinAddressInfo>,
    lastUnusedAddress?: AddressModel,
}

/**
 * Model of full Bitcoin Address in blockchain
 * The address only can be exist if it has at least a transaction
 * The balance of an address is TotalReceve - TotalSend
 */
export interface BitcoinAddressInfo {
    address: string,                        // The address itself
    exist: boolean,                         // Is there any transaction for this address
    balance: number,                        // Current balance
    addressModel?: AddressModel,            // Path to this address
    txInfo: BitcoinBlockchainAddress,      // List of this address transactions
}

/**
 * Model of an exist address in blockchain
 * Each exist address should have at least one transaction
 * Each exist address can have list of UTXO
 */
export interface BitcoinBlockchainAddress {
    totalReceive: number,
    totalSent: number,
    utxOs: Array<BitcoinUtxo>,
    transactionIds: Array<number>,
    transactions: Array<BitcoinTransactionInfo>,
}

/**
 * Model of an UTXO
 */
export interface BitcoinUtxo {
    hash: string,
    index: number,
    amount: number,
    blockNumber?: number,
}

/**
 * Model of Bitcoin Transaction
 */
export interface BitcoinTxInfo {
    hash: string,
    size: number,
    timeStamp: number,
    blockNumber: number,
    isCoinBase: boolean,
    index: number,
    inputs: Array<BitcoinTransactionInput>,
    outputs: Array<BitcoinTransactionOutput>,
    version: number,
    lockTime: number,
}

/**
 * Model of Bitcoin Transaction Input
 */
export interface BitcoinTransactionInput {
    index: number,
    spentTxHash: string,
    spentOutputIndex: number,
    script: string,
    scriptHex: string,
    type: string,
    address: string,
    value: string,
    sequence: number,
    valueNumber: number,
}
/**
 * Model of Bitcoin Transaction Output
 */
export interface BitcoinTransactionOutput {
    index: number,
    spendTxHash: string,
    script: string,
    scriptHex: string,
    type: string,
    address: string,
    value: string,
    isSpent: boolean,
    valueNumber: number,
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

export interface BitcoinTransactionInfo {
    blockNumber: number,
    hash: string,
    timeStamp: number,
    balanceChange: number,
    txId: number,
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
