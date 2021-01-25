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

export type EthereumTx = {
    address_n: Array<number>,
    to: string,
    value: string,
    gasPrice: string,
    gasLimit: string,
    nonce: string,
    data?: string,
    chainId?: number,
    txType?: number,
    v?: string,
    r?: string,
    s?: string,
}

export type EthTxToProkey = {
    address_n: Array<number>,
    to: string,
    value: Uint8Array,
    gas_price: Uint8Array,
    gas_limit: Uint8Array,
    nonce: Uint8Array,
    data?: string,
    chain_id?: number,
    tx_type?: number,
    data_length?: number,
    data_initial_chunk?: Uint8Array,
    
}