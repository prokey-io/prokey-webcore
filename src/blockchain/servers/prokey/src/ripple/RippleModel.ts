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

import { AddressModel } from "../../../../../models/Prokey";

export interface RippleAccount
{
    Account: string,
    AccountTxnID?: string,
    Balance?: string,
    Domain?: string,
    EmailHash?: string,
    MessageKey?: string,
    RegularKey?: string,
    OwnerCount: number,
    PreviousTxnID: string,
    PreviousTxnLgrSeq: number,
    Sequence: number,
    TickSize: number,
    TransferRate: number,
    LedgerEntryType: string,
    Flags: number,
    index: string,

    addressModel?: AddressModel,
}

export interface RippleTransactionInfo
{
    Account: string,
    Amount: string,
    Destination: string,
    Fee: string,
    Flags: number,
    Sequence: number,
    SigningPubKey: string,
    TransactionType: string,
    TxnSignature: string,
    hash: string,
    date: number,
}

export interface RippleTransactionDataInfo
{
    meta: any,
    tx: RippleTransactionInfo,
    validated: boolean
}

export interface RippleDrop
{
    base_fee: string,
    median_fee: string,
    minimum_fee: string,
    open_ledger_fee: string
}

export interface RippleFee
{
    current_ledger_size: string,
    current_queue_size: string,
    drops: RippleDrop,
    expected_ledger_size: string,
    ledger_current_index: number,
    levels: any,
    max_queue_size: string,
    status: string,
    validated: boolean
}
