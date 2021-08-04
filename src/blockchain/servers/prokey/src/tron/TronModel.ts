/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
 * Ali Akbar Mohammadi
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

export type TronAccountInfo = {
    latest_opration_time: number;
    address: string;
    balance: number;
    create_time: number;
    trc20?: Array<any>; // TRC20 balances
    latest_consume_free_time: number;
}

export type TronContractRet = {
    contractRet: string;
    fee: number;
}

export type TronContractTransfer = {
    amount: number;
    owner_address: string;
    to_address: string;
}

export type TronContractParameter = {
    value: TronContractTransfer | any;
    type: string;
}

export type TronContract = {
    parameter: TronContractParameter;
    type: string;
}

export type TronTransactionRawData = {
    contract:  Array<TronContract>;
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
}

export type TronTransactionDataInfo = {
    ret: Array<TronContractRet>;
    signature: Array<string>;
    txID: string;
    raw_data_hex: string;
    net_usage: number;
    net_fee: number;
    energy_usage: number;
    blockNumber: number;
    block_timestamp: number;
    energy_fee: number;
    energy_usage_total: number;
    raw_data: TronTransactionRawData;
}

export type TronTokenInfo = {
    symbol: string;
    address: string;
    decimals: number;
    name: string;
}

export type TronTrc20TransactionDataInfo = {
    transaction_id: string;
    token_info: TronTokenInfo;
    block_timestamp: number;
    from: string;
    to: string;
    type: string;
    value: string;
}

export type TronBlockHeaderRawData = {
    number: number;
    txTrieRoot: string;
    witness_address: string;
    parentHash: string;
    version: number;
    timestamp: number;
}

export type TronBlockHeader = {
    raw_data: TronBlockHeaderRawData;
    witness_signature: string;
}

export type TronBlock = {
    blockID: string;
    block_header: TronBlockHeader;
}