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


export interface EthereumAddressInfo {
    balance?: number,
    nonce?: number,
    trKeys?: Array<number>,
    transactions?: Array<EthereumTransaction>,
    addressModel?: AddressModel,
}

/**
 * This is the result of account discovery
 * Result of account discovery is a Wallet with total balance and list of AccountInfo
 * @end
 */
export interface EthereumWalletModel {
    totalBalance: number,
    accounts?: Array<EthereumAccountInfo>,
}

/**
 * Each wallet contains a list of accounts
 * Most of the times there is just one account
 * 
 * Result of account discovery is total account balance and list of Addresses with all info
 */
export interface EthereumAccountInfo {
    balance: number,
    accountIndex: number,
    nonce?: number,
    addressModel?: AddressModel,
    transactions?: Array<EthereumTransaction>,
    trKeys?: Array<number>
}

export interface EthereumTransaction {
    hash?: string,
    fromAddress?: string,
    toAddress?: string,
    amount?: number,
    gas?: number,
    gasPrice?: number,
    block?: number,
    nonce?: number,
  
    //! ERC20
    logIndex?: number,
  }

  export interface EthereumTransactionView {
    hash: string,
    blockNumber: number,
    date: string,
    amount: number,
    status: 'RECEIVED' | 'SENT',
    received?: string,
    sent?: string,
    fee?: number,
}