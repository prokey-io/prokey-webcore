/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
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

import { BitcoinBaseCoinInfoModel,
    EthereumBaseCoinInfoModel,
    Erc20BaseCoinInfoModel,
    MiscCoinInfoModel,
    OmniCoinInfoModel,
    RippleCoinInfoModel,
 } from "../models/CoinInfoModel";

 import * as EthereumNetworks from "../utils/ethereum-networks";

const compareVersions = require('compare-versions');

const modelName = require.resolve("../../data/ProkeyCoinsInfo.json");
delete require.cache[modelName];
const ProkeyCoinInfoModel = require("../../data/ProkeyCoinsInfo.json");

export enum CoinBaseType {
    BitcoinBase,
    EthereumBase,
    ERC20,
    NEM,
    OMNI,
    Ripple,
    Stellar,
    OTHERS
}

export interface CoinNameModel {
    Name: string;
    Shortcut: string;
    Type: CoinBaseType;
    Priority: Number;
    ContractAddress: string;
    Decimals: number;
    ChainOrPropertyId?: number;
}

export class CoinInfo {

    /**
     * This function will return the CoinInfo by coinName and type
     * @param coinName The coin name or shortcut
     * @param coinType Which coin type are you looking for? BitcoinBase, ERC20 or Ethereum.
     * @param chainOrPropertyId For Ethereum or OMNI, this property can be used instead of name if set.
     */
    public static Get<T>(coinName: string, coinType: CoinBaseType, chainOrPropertyId?: number): T {
        if (coinType == undefined)
            throw new Error();

        if(coinType == CoinBaseType.ERC20 && coinName.length <= 0 ) {
            throw new Error("You have to provide Contract Address for ERC20 tokens");
        } else if( (coinType == CoinBaseType.EthereumBase || coinType == CoinBaseType.OMNI) && coinName.length == 0 && chainOrPropertyId == null) {
            throw new Error("No Chain ID or coin name provided");
        }

        let c: any;
        switch (coinType) {
            case CoinBaseType.BitcoinBase:
                c = ProkeyCoinInfoModel.bitcoin;
                break;
            case CoinBaseType.EthereumBase:
                c = ProkeyCoinInfoModel.eth;
                break;
            case CoinBaseType.ERC20:
                c = ProkeyCoinInfoModel.erc20;
                break;
            case CoinBaseType.OMNI:
                c = ProkeyCoinInfoModel.omni;
                break;
            case CoinBaseType.Ripple:
                c = ProkeyCoinInfoModel.ripple;
                break;
        }

        let f = coinName.toLowerCase();

        let ci: any;

        switch(coinType){
            case CoinBaseType.BitcoinBase:
                ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);

                ci.id = `btc_${ci.shortcut}`;
                break;
            case CoinBaseType.EthereumBase:
                if(chainOrPropertyId != null) {
                    ci = c.find( token => token.chain_id == chainOrPropertyId);
                } else {
                    ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);
                }

                ci.id = `eth_${ci.shortcut}`;
                break;
            case CoinBaseType.ERC20:
                ci = c.find(obj => obj.address.toLowerCase() == f || obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);

                ci.id = `erc20_${EthereumNetworks.GetNetworkByChainId(ci.chain_id)}_${ci.shortcut}`;
                ci.slip44 = EthereumNetworks.GetSlip44ByChainId(ci.chain_id);
                break;
            case CoinBaseType.OMNI:
                if(chainOrPropertyId != null) {
                    ci = c.find( token => token.proparty_id == chainOrPropertyId);
                } else {
                    ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);
                }

                ci.id = `omni_${ci.shortcut}`;
                break;
            case CoinBaseType.Ripple:
                ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);

                ci.id = `ripple_${ci.shortcut}`;
                break;
            default:
                ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);

                ci.id = `unknown_${ci.shortcut}`;
                break;
        }

        if (ci)
        {
            ci.coinBaseType = coinType;
            return ci;
        }
        else
            throw new Error(`cannot find ${coinName}`);
    }

    /**
     * Returning the sorted list of all coins
     * @param firmwareVersion Specific Version of Prokey which support this coin
     */
     public static GetAllCoinsInfoByVersion(firmwareVersion: string): Array< BitcoinBaseCoinInfoModel |
                                                                        EthereumBaseCoinInfoModel |
                                                                        Erc20BaseCoinInfoModel |
                                                                        MiscCoinInfoModel |
                                                                        OmniCoinInfoModel |
                                                                        RippleCoinInfoModel> {

        let list = new Array<BitcoinBaseCoinInfoModel |
                                EthereumBaseCoinInfoModel |
                                Erc20BaseCoinInfoModel |
                                MiscCoinInfoModel |
                                OmniCoinInfoModel |
                                RippleCoinInfoModel>();

        //! For all bitcoin base coins
        ProkeyCoinInfoModel.bitcoin.forEach(coin => {
            //! Check the version
            if(compareVersions(firmwareVersion, coin.support.optimum) >= 0) {
                list.push({
                    ...coin,
                    coinBaseType: CoinBaseType.BitcoinBase,
                    id: `btc_${coin.shortcut}`,
                })
            }
        });

        //! For all ethereum base coins
        ProkeyCoinInfoModel.eth.forEach(coin => {
            if(compareVersions(firmwareVersion, coin.support.optimum) >= 0) {
                list.push({
                    ...coin,
                    coinBaseType: CoinBaseType.EthereumBase,
                    id: `eth_${coin.shortcut}`,
                });
            }
        });

        //! For all ERC20 tokens
        ProkeyCoinInfoModel.erc20.forEach(token => {
            if(compareVersions(firmwareVersion, token.support.optimum) >= 0) {
                list.push({
                    ...token,
                    coinBaseType: CoinBaseType.ERC20,
                    id: `erc20_${EthereumNetworks.GetNetworkByChainId(token.chain_id)}_${token.shortcut}`,
                    slip44: EthereumNetworks.GetSlip44ByChainId(token.chain_id),
                });
            }
        });

        //! For all OMNI tokens in support file
        ProkeyCoinInfoModel.omni.forEach(omni => {
            if(compareVersions(firmwareVersion, omni.support.optimum) >= 0) {
                list.push({
                    ...omni,
                    decimals: (omni.divisible) ? 8 : 0,
                    coinBaseType: CoinBaseType.OMNI,
                    id: `omni_${omni.shortcut}`,
                });
            }
        });

        //! For all Ripple base coins
        ProkeyCoinInfoModel.ripple.forEach(ripple => {
            //! Check the version
            if(compareVersions(firmwareVersion, ripple.support.optimum) >= 0) {
                list.push({
                    ...ripple,
                    coinBaseType: CoinBaseType.Ripple,
                    id: `ripple_${ripple.shortcut}`,
                })
            }
        });

        //! Sort the list by Priority
        list.sort((a, b) => {
            if (a.priority > b.priority)
                return 1;
            else if (a.priority < b.priority)
                return -1;
            else
                return 0;
        });

        return list;
    }
    static compareVersions(firmwareVersion, networkVersion) {
      return compareVersions(firmwareVersion, networkVersion);
    }
}
