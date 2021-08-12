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
            case CoinBaseType.EthereumBase:
                if(chainOrPropertyId != null) {
                    ci = c.find( token => token.chain_id == chainOrPropertyId);
                } else {
                    ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);
                }
                break;
            case CoinBaseType.ERC20:
                ci = c.find(obj => obj.address.toLowerCase() == f || obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);
                break;
            case CoinBaseType.OMNI:
                if(chainOrPropertyId != null) {
                    ci = c.find( token => token.proparty_id == chainOrPropertyId);
                } else {
                    ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);
                }
                break;
            default:
                ci = c.find(obj => obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f);
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
    public static GetAllCoinsName(firmwareVersion: string): Array<CoinNameModel> {
        let list = new Array<CoinNameModel>();

        //! For all bitcoin base coins
        ProkeyCoinInfoModel.bitcoin.forEach(btcBaseCoin => {
            //! Check the version
            if(compareVersions(firmwareVersion, btcBaseCoin.support.optimum) >= 0) {
                list.push({
                    Name: btcBaseCoin.name,
                    Shortcut: btcBaseCoin.shortcut,
                    Type: CoinBaseType.BitcoinBase,
                    Priority: btcBaseCoin.priority,
                    ContractAddress: '',
                    Decimals: btcBaseCoin.decimals,
                })
            }
        });

        //! For all ethereum base coins
        ProkeyCoinInfoModel.eth.forEach(ethBaseCoin => {
            if(compareVersions(firmwareVersion, ethBaseCoin.support.optimum) >= 0) {
                list.push({
                    Name: ethBaseCoin.name,
                    Shortcut: ethBaseCoin.shortcut,
                    Type: CoinBaseType.EthereumBase,
                    Priority: ethBaseCoin.priority,
                    ContractAddress: '',
                    Decimals: ethBaseCoin.decimals,
                    ChainOrPropertyId: ethBaseCoin.chain_id,
                });
            }
        });

        //! For all ERC20 tokens
        ProkeyCoinInfoModel.erc20.forEach(erc20 => {
            if(compareVersions(firmwareVersion, erc20.support.optimum) >= 0) {
                list.push({
                    Name: erc20.name,
                    Shortcut: erc20.shortcut,
                    Type: CoinBaseType.ERC20,
                    Priority: erc20.priority,
                    ContractAddress: erc20.address,
                    Decimals: erc20.decimals,
                    ChainOrPropertyId: erc20.chain_id,
                });
            }
        });

        //! For all OMNI tokens in support file
        ProkeyCoinInfoModel.omni.forEach(omni => {
            if(compareVersions(firmwareVersion, omni.support.optimum) >= 0) {
                list.push({
                    Name: omni.name,
                    Shortcut: omni.shortcut,
                    Type: CoinBaseType.OMNI,
                    Priority: omni.priority,
                    ContractAddress: '',
                    Decimals: omni.divisible ? 8 : 0,
                    ChainOrPropertyId: omni.proparty_id,
                });
            }
        });

        //! For all Ripple base coins
        ProkeyCoinInfoModel.ripple.forEach(ripple => {
            //! Check the version
            if(compareVersions(firmwareVersion, ripple.support.optimum) >= 0) {
                list.push({
                    Name: ripple.name,
                    Shortcut: ripple.shortcut,
                    Type: CoinBaseType.Ripple,
                    Priority: ripple.priority,
                    ContractAddress: '',
                    Decimals: ripple.decimals,
                })
            }
        });

        //! Sort the list by Priority
        list.sort((a, b) => {
            if (a.Priority > b.Priority)
                return 1;
            else if (a.Priority < b.Priority)
                return -1;
            else
                return 0;
        });

        return list;
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

        //! For all bitcoin base coins in support file
        ProkeySupport.bitcoin.forEach(support => {
            //! Check the version
            if(compareVersions(firmwareVersion, support.optimum) >= 0) {
                //! Find the coin in ProkeyCoinInfo.json
                let coin = ProkeyCoinInfoModel.bitcoin.find(c => c.name == support.name);
                if(coin != null) {
                    list.push({
                        ...coin,
                        coinBaseType: CoinBaseType.BitcoinBase,
                    })
                }
            }
        });

        //! For all ethereum base coins in support file
        ProkeySupport.eth.forEach(support => {
            if(compareVersions(firmwareVersion, support.optimum) >= 0) {
                //! Find the coin in ProkeyCoinInfo.json using chain_id
                let coin = ProkeyCoinInfoModel.eth.find(c => c.chain_id == support.chain_id);
                //! Add coin to list
                if(coin != null) {
                    list.push({
                        ...coin,
                        coinBaseType: CoinBaseType.EthereumBase,
                    });
                }
            }
        });

        //! For all ERC20 tokens in support file
        ProkeySupport.erc20.forEach(support => {
            if(compareVersions(firmwareVersion, support.optimum) >= 0) {
                //! Add all ERC20 tokens in ProkeyCoinInfo.json which have same chain_id 
                ProkeyCoinInfoModel.erc20.forEach(token => {
                    if(token.chain_id == support.chain_id) {
                        list.push({
                            ...token,
                            coinBaseType: CoinBaseType.ERC20,
                        });
                    }
                });
            }
        });

        //! For all OMNI tokens in support file
        ProkeySupport.omni.forEach(support => {
            if(compareVersions(firmwareVersion, support.optimum) >= 0) {
                //! Add all OMNI tokens in ProkeyCoinInfo.json which have same proparty_id 
                ProkeyCoinInfoModel.omni.forEach(token => {
                    if(token.proparty_id == support.proparty_id) {
                        list.push({
                            ...token,
                            coinBaseType: CoinBaseType.OMNI,
                            decimals: (token.divisible) ? 8 : 0,
                        });
                    }
                });
            }
        });

        //! For all Ripple base coins in support file
        ProkeySupport.ripple.forEach(support => {
            //! Check the version
            if(compareVersions(firmwareVersion, support.optimum) >= 0) {
                //! Find the coin in ProkeyCoinInfo.json
                let coin = ProkeyCoinInfoModel.ripple.find(c => c.name == support.name);
                if(coin != null) {
                    list.push({
                        ...coin,
                        coinBaseType: CoinBaseType.Ripple
                    })
                }
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

    /**
     * Returning the sorted list of a specific coin type
     * @param coinType is the Coin type needed
     */
    public static GetCoinsByType(coinType: CoinBaseType, chainOrPropertyId = 0): Array<CoinNameModel> {
        let list = new Array<CoinNameModel>();

        if (coinType == CoinBaseType.BitcoinBase) {
            // Add list of bitcoin base coins
            ProkeyCoinInfoModel.bitcoin.forEach(element => {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.BitcoinBase,
                    Priority: element.priority,
                    ContractAddress: '',
                    Decimals: element.decimals,
                });
            });
        }
        else if (coinType == CoinBaseType.EthereumBase) {
            // Add list of ethereum base coins
            ProkeyCoinInfoModel.eth.forEach(element => {
                if(chainOrPropertyId != 0) {
                    if(element.chain_id == chainOrPropertyId) {
                        list.push({
                            Name: element.name,
                            Shortcut: element.shortcut,
                            Type: CoinBaseType.EthereumBase,
                            Priority: element.priority,
                            ContractAddress: '',
                            Decimals: element.decimals,
                        });
                    }
                } else {
                    list.push({
                        Name: element.name,
                        Shortcut: element.shortcut,
                        Type: CoinBaseType.EthereumBase,
                        Priority: element.priority,
                        ContractAddress: '',
                        Decimals: element.decimals,
                    });
                }
            });
        }
        else if (coinType == CoinBaseType.ERC20) {
            // Add list of ERC20 coins
            ProkeyCoinInfoModel.erc20.forEach(element => {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.ERC20,
                    Priority: element.priority,
                    ContractAddress: element.address,
                    Decimals: element.decimals,
                });
            });
        }
        else if (coinType == CoinBaseType.OMNI) {
            ProkeyCoinInfoModel.omni.forEach(element => {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.OMNI,
                    Priority: element.priority,
                    ContractAddress: element.address,
                    Decimals: element.divisible ? 8 : 0,
                });
            });
        }
        else if(coinType == CoinBaseType.Ripple){
            ProkeyCoinInfoModel.ripple.foreach(element => {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.Ripple,
                    Priority: element.priority,
                    ContractAddress: '',
                    Decimals: element.decimals,
                });
            });
        }

        //! Sort the list by Priority
        list.sort((a, b) => {
            if (a.Priority > b.Priority)
                return 1;
            else if (a.Priority < b.Priority)
                return -1;
            else
                return 0;
        });

        return list;
    }
}