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

import {
    RefTransaction,
    TransactionInput,
    TransactionOutput,
    TransactionOptions,
} from './Prokey';

export interface BitcoinOutputModel {
    Address: string,
    value: number,
    data?: string,
}

export interface BitcoinTx {
    coinName: string,
    inputs: Array<TransactionInput>,
    outputs: Array<TransactionOutput>,
    refTxs?: Array<RefTransaction>,
    options: TransactionOptions,    
}

export interface BitcoinSignTxParams {
    outputs_count: number,                              // number of transaction outputs
    inputs_count: number,                               // number of transaction inputs
    coin_name?: string,                                 // coin to use
    version?: number,                                   // transaction version
    lock_time?: number,                                 // transaction lock_time
    expiry?: number,                                    // only for Decred and Zcash
    overwintered?: boolean,                             // only for Zcash
    version_group_id?: number,                          // only for Zcash, nVersionGroupId when overwintered is set
    timestamp?: number,                                 // only for Capricoin, transaction timestamp
    branch_id?: number,                                 // only for Zcash, BRANCH_ID when overwintered is set
}