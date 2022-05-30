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

export interface Vin {
    txid: string;
    sequence: any;
    n: number;
    addresses: string[];
    isAddress: boolean;
    value: string;
    hex: string;
    vout?: number;
}

export interface Vout {
    value: string;
    n: number;
    hex: string;
    addresses: string[];
    isAddress: boolean;
    spent?: boolean;
}

export interface Transaction {
    txid: string;
    version: number;
    vin: Vin[];
    vout: Vout[];
    blockHash: string;
    blockHeight: number;
    confirmations: number;
    blockTime: number;
    value: string;
    valueIn: string;
    fees: string;
    hex: string;
}

export interface Token {
    type: string;
    name: string;
    path: string;
    transfers: number;
    decimals: number;
    balance: string;
    totalReceived: string;
    totalSent: string;
}

export interface BlockbookAccountInfo {
    page?: number;
    totalPages?: number;
    itemsOnPage?: number;
    address: string;
    balance: string;
    totalReceived: string;
    totalSent: string;
    unconfirmedBalance: string;
    unconfirmedTxs: number;
    txs: number;
    transactions?: Transaction[];
    txids?: string[];
    usedTokens: number;
    tokens?: Token[];
}