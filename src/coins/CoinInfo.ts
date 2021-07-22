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

const modelName = require.resolve("../../data/ProkeyCoinsInfo.json");
delete require.cache[modelName];
const ProkeyCoinInfoModel = require("../../data/ProkeyCoinsInfo.json");
const compareVersions = require('compare-versions');

export enum CoinBaseType {
    BitcoinBase,
    EthereumBase,
    ERC20,
    NEM,
    OMNI,
    Ripple,
    Tron,
    OTHERS
}

export interface CoinNameModel {
    Name: string;
    Shortcut: string;
    Type: CoinBaseType;
    Priority: Number;
    ContractAddress: string;
    Decimals: number;
}

export class CoinInfo {

    /**
     * This function will return the CoinInfo by coinName and type
     * @param coinName The coin name or shortcut
     * @param ct Which coin type are you looking for? BitcoinBase, ERC20 or Ethereum.
     */
    public static Get<T>(coinName: string, ct: CoinBaseType): T {
        if (ct == undefined)
            throw new Error();

        let f = coinName.toLowerCase();

        let c: any;
        switch (ct) {
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
            case CoinBaseType.Tron:
                c = ProkeyCoinInfoModel.tron;
                break;
        }

        let ci: any;
        if (ct == CoinBaseType.ERC20) {
            ci = c.find(obj => {
                return obj.address.toLowerCase() == f || obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f;
            });
        } else {
            ci = c.find(obj => {
                return obj.name.toLowerCase() == f || obj.shortcut.toLowerCase() == f;
            });
        }

        if (ci)
            return ci;
        else
            throw new Error(`cannot find ${coinName}`);
    }

    /**
     * Returning the sorted list of all coins
     * @param firmwareVersion Specific Version of Prokey which support this coin
     */
    public static GetAllCoinsName(firmwareVersion: string): Array<CoinNameModel> {
        let list = new Array<CoinNameModel>();

        // Add list of bitcoin base coins
        ProkeyCoinInfoModel.bitcoin.forEach(element => {
            if (compareVersions(firmwareVersion, element.support.optimum) >= 0) {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.BitcoinBase,
                    Priority: element.priority,
                    ContractAddress: '',
                    Decimals: element.decimals,
                });
            }
        });

        // Add list of ethereum base coins
        ProkeyCoinInfoModel.eth.forEach(element => {
            if (compareVersions(firmwareVersion, element.support.optimum) >= 0) {
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

        // Add list of OMNI coins
        ProkeyCoinInfoModel.omni.forEach(element => {
            list.push({
                Name: element.name,
                Shortcut: element.shortcut,
                Type: CoinBaseType.OMNI,
                Priority: element.priority,
                ContractAddress: '',
                Decimals: element.divisible ? 8 : 0,
            })
        });

        // Add list of Ripple
        ProkeyCoinInfoModel.ripple.forEach(element => {
            if (compareVersions(firmwareVersion, element.support.optimum) >= 0) {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.Ripple,
                    Priority: element.priority,
                    ContractAddress: '',
                    Decimals: element.decimals,
                });
            }
        });

        // Add Tron to the list
        ProkeyCoinInfoModel.tron.forEach(element => {
            if (compareVersions(firmwareVersion, element.support.optimum) >= 0) {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.Tron,
                    Priority: element.priority,
                    ContractAddress: '',
                    Decimals: element.decimals,
                });
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
     * Returning the sorted list of a specific coin
     * @param firmwareVersion Specific Version of Prokey which support this coin
     */
    public static GetCoinsByType(ct: CoinBaseType): Array<CoinNameModel> {
        let list = new Array<CoinNameModel>();

        if (ct == CoinBaseType.BitcoinBase) {
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
        else if (ct == CoinBaseType.EthereumBase) {
            // Add list of ethereum base coins
            ProkeyCoinInfoModel.eth.forEach(element => {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.EthereumBase,
                    Priority: element.priority,
                    ContractAddress: '',
                    Decimals: element.decimals,
                });
            });
        }
        else if (ct == CoinBaseType.ERC20) {
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
        else if (ct == CoinBaseType.OMNI) {
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
        else if(ct == CoinBaseType.Ripple){
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
        else if(ct == CoinBaseType.Tron) {
            ProkeyCoinInfoModel.tron.foreach(element => {
                list.push({
                    Name: element.name,
                    Shortcut: element.shortcut,
                    Type: CoinBaseType.Tron,
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