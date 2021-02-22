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

interface ProkeySupport {
    optimum: string,
}

export interface BitcoinBaseCoinInfoModel {
    blocktime: number,
    //cashAddrPrefix?: string,
    label: string, // this is human readable format, could be different from "name"
    name: string,
    shortcut: string,
    dust_limit: number,
    force_bip143: boolean,
    fork_id?: number,
    max_address_length: number,
    maxfee_kb: number,
    min_address_length: number,
    minfee_kb: number,
    segwit: boolean,
    // signed_message_header: in Network
    slip44: number,
    support: ProkeySupport,
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
    test?: boolean,
    tx_url: string,
};

export interface EthereumBaseCoinInfoModel {
    chain: string,
    chain_id: number,
    name: string
    rskip60: boolean,
    shortcut: string,
    slip44: number,
    support: ProkeySupport,
    url: string,
    on_device?: string,
    test?: boolean,
    tx_url: string,
}

export interface Erc20BaseCoinInfoModel {
    chain_id: number,
    shortcut: string,
    name: string,
    type: string
    address: string,
    ens_address: string,
    decimals: number,
    website: string,
    on_device?: string,
    test?: boolean,
    tx_url: string,
}

export interface MiscCoinInfoModel {
    type: 'misc' | 'nem';
    blocktime: number;
    curve: string;
    min_fee: number;
    max_fee: number;
    label: string; 
    name: string;
    shortcut: string;
    slip44: number;
    support: ProkeySupport;
    decimals: number;
    on_device: string,
    test?: boolean,
    tx_url: string,
}

export interface OmniCoinInfoModel {
    shortcut: string,
    name: string,
    blockchain: string,
    segwit: boolean,
    slip44: number,
    divisible: boolean,
    proparty_id: number,
    on_device: string,
    test?: boolean,
    dust_limit: number,
    tx_url: string,
}