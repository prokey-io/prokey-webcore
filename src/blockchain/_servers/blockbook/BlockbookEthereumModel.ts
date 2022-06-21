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

/**
 * This is a ethereum account model
 */
export interface EthereumAddressModel {
    // current page, starting from 1
    page?: number;
    // total number of pages
    totalPages?: number;
    // number of items on page
    itemsOnPage?: number;
    // the requested address
    address: string;
    // total current balance
    balance: string;
    // the balance which is not confirmed yet
    unconfirmedBalance: string;
    // number of unconfirmed transactions
    unconfirmedTxs: number;
    // total number of transactions
    txs: number;
    // total number of non-token transactions
    nonTokenTxs: number;
    // list of transactions
    transactions?: EthereumTransactionInfoModel[];
    // list of transactions' ids(hash)
    txids?: string[],
    // address nonce
    nonce: string;
    // list of tokens
    tokens?: EthereumTokenModel[];
}

/**
 * Ethereum transaction model in blockchain
 */
export interface EthereumTransactionInfoModel {
    // txid
    txid: string;
    // list of inputs
    vin: EthereumTransactionInputModel[];
    // list of outputs
    vout: EthereumTransactionOutputModel[];
    // hash of the block in which this transaction exist
    blockHash: string;
    // the block number in which this transaction exist
    blockHeight: number;
    // number of confirmations (lastBlockNumber - blockHeight)
    confirmations: number;
    // the time of block in which this transaction exist
    blockTime: number;
    // transaction value
    value: string;
    // transaction fee
    fees: string;
    // specific information about ethereum
    ethereumSpecific: EthereumSpecificInfoModel;
    // token transfer info
    tokenTransfers: EthereumTokenTransferModel[];
}

/**
 * Ethereum input model
 */
export interface EthereumTransactionInputModel {
    // index of this input
    n: number;
    // list of address
    addresses: string[];
    // true if addresses contains an actual address
    isAddress: boolean;
    // true if it's from own address(SEND), otherwise null
    isOwn?: boolean;
}

/**
 * Ethereum output model
 */
export interface EthereumTransactionOutputModel {
    // sent value
    value: string;
    // index of this output
    n: number;
    // list of addresses
    addresses: string[];
    // true if addresses contains an actual address
    isAddress: boolean;
    // true if it's to own address(RECEIVE), otherwise null
    isOwn?: boolean;
}

/**
 * Other Ethereum transaction data
 */
export interface EthereumSpecificInfoModel {
    // transaction status
    status: number;
    // nonce!
    nonce: number;
    // gas limit
    gasLimit: number;
    // gas used
    gasUsed: number;
    // gas price
    gasPrice: string;
    // data
    data: string;
}

/**
 * Token transfer data
 */
export interface EthereumTokenTransferModel {
    // type
    type: string;
    // from
    from: string;
    // to
    to: string;
    // token address
    token: string;
    // name of token
    name: string;
    // symbol of token
    symbol: string;
    // decimals
    decimals: number;
    // value
    value: string;
}


export interface EthereumTokenModel {
    // type
    type: string;
    // name of token
    name: string;
    // contract address
    contract: string;
    // number of transactions
    transfers: number;
    // symbol of token
    symbol: string;
    // decimals
    decimals: number;
    // balance
    balance: string;
}

