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

const _serverFileModel = require.resolve("../../data/BlockchainProviders.json");
delete require.cache[_serverFileModel];
const _providers = require("../../data/BlockchainProviders.json");

import { CoinBaseType } from "../coins/CoinInfo";
import { BaseCoinInfoModel, Erc20BaseCoinInfoModel, EthereumBaseCoinInfoModel } from "../models/CoinInfoModel";

export interface BlockchainServerModel {
    apiType: string,
    url: string,
    serverName: string,
    isSupportXpub?: boolean,
}

/**
 * Servers model in providers.json file
 */
interface ProviderServerModel {
    apiType: string,
    name: string,
    baseUrl: string,
    isSupportXpub?: boolean,
}

/**
 * Coins model in providers.json file
 */
interface ProviderCoinModel {
    type: number,
    name: string,
    shortcut: string,
    chainId?: number,
    servers: [{
        name: string,
        urlAffix?: string
    }]
}

export class BlockchainProviders {
    public static Get(coinInfo: BaseCoinInfoModel): BlockchainServerModel[] {
        let coins: ProviderCoinModel[] = _providers.coins;
        let allServers: ProviderServerModel[] = _providers.servers;

        if(coins == undefined || allServers == undefined) {
            throw new Error("Error in reading providers.json file");
        }

        // CoinName
        const cn = coinInfo.name.toLocaleLowerCase();

        // Coin shortcut
        const cs = coinInfo.shortcut.toLocaleLowerCase();

        let coin: ProviderCoinModel | undefined;

        // serveral servers can be supported
        let servers: BlockchainServerModel[] = [];

        // The matching algorithm can be defferent based on coin type
        switch(coinInfo.coinBaseType){
            // For bitcoin based
            case CoinBaseType.BitcoinBase:
                // find the coin in providers
                coin = coins.find(c => c.type == CoinBaseType.BitcoinBase && (c.name.toLowerCase() == cn || c.shortcut == cs));
                break;
            case CoinBaseType.EthereumBase:
                // find the coin in providers
                coin = coins.find(c => c.type == CoinBaseType.EthereumBase && c.chainId == (coinInfo as EthereumBaseCoinInfoModel).chain_id);
                break;
            case CoinBaseType.ERC20:
                // find the coin in providers
                coin = coins.find(c => c.type == CoinBaseType.EthereumBase && c.chainId == (coinInfo as Erc20BaseCoinInfoModel).chain_id);
                break;
            case CoinBaseType.OMNI:
                // We support OMNI on Bitcoin network
                coin = coins.find(c => c.type == CoinBaseType.BitcoinBase && (c.name.toLowerCase() == "bitcoin" || c.shortcut == "BTC"));
                break;
            case CoinBaseType.NEM:
            case CoinBaseType.Stellar:
            case CoinBaseType.Ripple:
                // find the coin in providers
                coin = coins.find(c => c.type == CoinBaseType.Ripple && (c.name.toLowerCase() == "ripple" || c.shortcut.toLowerCase() == "xrp"));
                break;
        }

        // not supported or no server!
        if(coin == undefined || coin.servers == undefined)
            return [];

        // for all available servers for this coin(at least one should be there)
        coin.servers.forEach(coinServer => {
            // find the specific server
            const s = allServers.find(s => s.name == coinServer.name);
            if(s != undefined) {
                // add prefix to url if any
                let url: string = s.baseUrl;
                if(coinServer.urlAffix){
                  const searchRegExp = new RegExp("\{a\}", 'g');
                  url = url.replace(searchRegExp, coinServer.urlAffix);
                }

                // push to list
                servers.push({
                    apiType: s.apiType,
                    serverName: s.name,
                    url: url,
                    isSupportXpub: s.isSupportXpub,
                });
            }
        });

        return servers;
    }
}
