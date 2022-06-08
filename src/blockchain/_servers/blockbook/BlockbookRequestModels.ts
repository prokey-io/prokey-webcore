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
 * Specifies level of details returned by request
 */
 export enum BlockbookDetails {
    Basic='basic', 
    Tokens='tokens',
    TokenBalances='tokenBalances',
    Txids='txids',
    Txs='txs',
    Txslight='txslight',
}

/**
 * Specifies what tokens (xpub addresses) are returned by the request
 */
export enum BlockbookTokens {
    Nonzero='nonzero',
    Used='used',
    Derived='derived',
}

/**
 * The request details
 */
export class BlockbookRequestDetails {
    // specifies level of details returned by request
    public details = BlockbookDetails.Basic; 

    // specifies what tokens (xpub addresses) are returned by the request
    public tokens = BlockbookTokens.Nonzero; 

    // specifies page of returned transactions, starting from 1. If out of range, Blockbook returns the closest possible page.
    public page = 1; 

    // number of transactions returned by call (default and maximum 1000)
    public pageSize = 1000;

    // filter of the returned transactions from block height (default no filter)
    public from?: number; 

    // filter of the returned transactions to block height (default no filter)
    public to?: number; 
}