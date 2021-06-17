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

export interface RippleAccountInfo
{
    Account: string,
    AccountTxnID?: string,
    Balance?: string,
    Domain?: null,
    EmailHash?: null,
    MessageKey?: null,
    RegularKey?: null,
    OwnerCount: number,
    PreviousTxnID: string,
    PreviousTxnLgrSeq: number,
    Sequence: number,
    TickSize: number,
    TransferRate: number,
    LedgerEntryType: string,
    Flags: number,
    index: string
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