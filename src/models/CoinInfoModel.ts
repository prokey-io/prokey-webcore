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

import { CoinBaseType } from "../coins/CoinInfo";

interface ProkeySupport {
    optimum: string,
}

export type GeneralCoinInfoModel = BitcoinBaseCoinInfoModel | 
    EthereumBaseCoinInfoModel | 
    Erc20BaseCoinInfoModel | 
    RippleCoinInfoModel | 
    OmniCoinInfoModel | 
    TronCoinInfoModel |
    MiscCoinInfoModel;

export interface BaseCoinInfoModel {
    name: string,
    shortcut: string,
    support: ProkeySupport,
    test?: boolean,
    decimals: number,
    slip44: number,

    //! Dynamic properties, Not in json file
    coinBaseType: CoinBaseType,
    id: string,
}

export interface BitcoinBaseCoinInfoModel extends BaseCoinInfoModel {
    blocktime: number,
    //cashAddrPrefix?: string,
    label: string, // this is human readable format, could be different from "name"
    
    
    dust_limit: number,
    force_bip143: boolean,
    fork_id?: number,
    max_address_length: number,
    maxfee_kb: number,
    min_address_length: number,
    minfee_kb: number,
    segwit: boolean,
    // signed_message_header: in Network
    
    //xPubMagic: number,
    //xPubMagicSegwitNative?: number,
    //xPubMagicSegwit?: number,

    // custom
    //network: Network,
    is_bitcoin: boolean,
    min_fee: number,
    max_fee: number,
    blocks?: number,
    decimals: number,
    on_device: string,
    
    tx_url: string,
    timestamp: boolean,
    priority: number,

};

export interface EthereumBaseCoinInfoModel extends BaseCoinInfoModel {
    chain: string,
    chain_id: number,
    rskip60: boolean,
    shortcut: string,
    url: string,
    on_device?: string,
    tx_url: string,
    priority: number,
}

export interface Erc20BaseCoinInfoModel extends BaseCoinInfoModel{
    chain_id: number,
    type: string
    address: string,
    ens_address: string,
    website: string,
    on_device?: string,
    tx_url: string,
    priority: number,
}

export interface MiscCoinInfoModel extends BaseCoinInfoModel {
    type: 'misc' | 'nem';
    blocktime: number;
    curve: string;
    min_fee: number;
    max_fee: number;
    label: string; 
    decimals: number;
    on_device: string,
    tx_url: string,
    priority: number,
}

export interface OmniCoinInfoModel extends BaseCoinInfoModel {
    blockchain: string,
    segwit: boolean,
    divisible: boolean,
    proparty_id: number,
    on_device: string,
    dust_limit: number,
    tx_url: string,
    timestamp: boolean,
    priority: number,
}

export interface RippleCoinInfoModel extends BaseCoinInfoModel {
    on_device: string,
    test?: boolean,
    tx_url: string,
    priority: number,
    min_balance: number,
}

export interface TronCoinInfoModel extends BaseCoinInfoModel {
    name: string,
    shortcut: string,
    slip44: number,
    decimals: number,
    on_device: string,
    support: ProkeySupport;
    test?: boolean,
    tx_url: string,
}