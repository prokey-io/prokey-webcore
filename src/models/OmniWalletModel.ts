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

import { AddressModel } from "./Prokey";
import {BaseAccountInfoModel} from "./GeneralModels";

/**
 * This is the result of account discovery
 * Result of account discovery is a Wallet with total balance and list of AccountInfo
 * @end
 */
export interface OmniWalletModel {
    totalBalance: number,
    accounts?: Array<OmniAccountInfo>,
}

export interface OmniAccountInfo extends BaseAccountInfoModel {
    addressModel?: AddressModel,
    trKeys?: Array<number>
}

export interface OmniTransactionView {
    hash: string,
    fromAddress: string,
    toAddress: string,
    amount: number,
    blockId: number,
    date: string,
    status: 'RECEIVED' | 'SENT',
    isValid: boolean,
    invalidReason?: string,
}

export interface OmniAddressInfo {
    balance: number,                        // Current balance
    addressModel?: AddressModel,            // Full Address Model
    trKeys?: Array<number>,
}

export interface OmniTxInfo {
    hash: string,
    fromAddress: string,
    toAddress: string,
    amount: number,
    type: number,
    positionInBlock: number,
    blockId: number,
    valid: boolean,
    invalidReason?: string,
    timeStamp: number,
}
