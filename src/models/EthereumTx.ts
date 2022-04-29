/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * Copyright (C) 2022 Hadi Robati hadi@prokey.io
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

export interface CommonEthereumTxModel  {
    address_n: Array<number>,
    to: string,
    value: string,
    gasLimit: string,
    nonce: string,
    data?: string,
    chainId?: number,
    txType?: number,
    v?: string,
    r?: string,
    s?: string,
};

export interface LegacyEthereumTxModel extends CommonEthereumTxModel {
    gasPrice: string,
    maxPriorityFeePerGas: typeof undefined,
    maxFeePerGas: typeof undefined,
}

export interface Eip1559EthereumTxModel extends CommonEthereumTxModel {
    gasPrice: typeof undefined,
    maxPriorityFeePerGas: string,
    maxFeePerGas: string,
}

export type EthereumTx = LegacyEthereumTxModel | Eip1559EthereumTxModel;

//! Models to be sent to device
export type EthTxToProkey = {
    address_n: Array<number>,
    to: string,
    value: Uint8Array,
    gas_price?: Uint8Array,
    max_gas_fee?: Uint8Array,
    max_priority_fee?: Uint8Array,
    gas_limit: Uint8Array,
    nonce: Uint8Array,
    data?: string,
    chain_id?: number,
    tx_type?: number,
    data_length?: number,
    data_initial_chunk?: Uint8Array,
}