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

import { BlockchainProviders, BlockchainServerModel } from './BlockchainProviders';
import { BlockchainBase } from './BlockchainBase';
import { BaseCoinInfoModel } from '../models/CoinInfoModel';
import { RippleServer } from './_servers/ripple/RippleRpcServer';
import { MyConsole } from '../utils/console';
import { AddressModel } from '../models/Prokey';
import * as WalletModel from '../models/RippleWalletModel';

type ProcessServersCallBack<T> = (server: BlockchainServerModel) => Promise<T>;
type ProcessServersError = (error: any) => void;

export class RippleBlockchain extends BlockchainBase {
    constructor(coinInfo: BaseCoinInfoModel) {
        const servers: Array<BlockchainServerModel> = BlockchainProviders.Get(coinInfo);
        super(servers);
    }

    public async GetAddressInfo(reqAdd: AddressModel): Promise<WalletModel.RippleAccountInfo> {
        this._ensureThereIsAServer();

        for (let i = 0; i < this._servers.length; i++) {
            try {
                // Get account data from ripple server
                let res = await RippleServer.GetAddressInfo(this._servers[i], reqAdd.address);
                if (res.status == 'success') {
                    if (res.account_data == null) {
                        throw new Error('Status is success but there is no account_data');
                    }

                    // return received data
                    return {
                        ...res.account_data,
                        isAccountFounded: true,
                        addressModel: reqAdd,
                    };
                } else {
                    // If this account/address is not available, the server returns "Account not found." with following data:
                    //  "error": "actNotFound"
                    //  "error_code": 19,
                    //  "error_message": "Account not found.",
                    // in this case, An empty account info with "isAccountFounded: false" flag will be retuned
                    if (res.error == 'actNotFound') {
                        return <WalletModel.RippleAccountInfo>{
                            isAccountFounded: false,
                            addressModel: reqAdd,
                        };
                    }

                    // If there is any error message
                    if (res.error_message) {
                        throw new Error(res.error_message);
                    }
                }
            } catch (e) {
                MyConsole.Exception('RippleBlockchain::GetAddressInfo->', e);
            }
        }

        throw new Error('RippleBlockchain::GetAddressInfo->Request has error');
    }

    public async BroadCastTransaction(transaction: string): Promise<WalletModel.RippleSubmitTransactionResponse> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            try {
                let res = await RippleServer.BroadCastTransaction(this._servers[i], transaction);
                if (res.status == 'success') {
                    return res;
                } else {
                    // If there is any error message
                    if (res.error_message) {
                        throw new Error(res.error_message);
                    } else {
                        throw new Error('Unknown server error');
                    }
                }
            } catch (e) {
                MyConsole.Exception('RippleBlockchain::BroadCastTransaction->', e);
            }
        }

        throw new Error('RippleBlockchain::BroadCastTransaction->Request has error');
    }

    /**
     * Get Account transactions
     * @param account The account address
     * @param limit Max number of transaction to retrive
     * @returns An array of Ripple Transaction
     */
    async GetAccountTransactions(
        account: string,
        limit: number = 10
    ): Promise<Array<WalletModel.RippleTransactionDataInfo>> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            try {
                let res = await RippleServer.GetAccountTransactions(this._servers[i], account, limit);
                if (res.status == 'success') {
                    if (res.transactions == null) {
                        throw new Error('Status is success but there is no transaction data');
                    }

                    return res.transactions;
                } else {
                    // If there is any error message
                    if (res.error_message) {
                        throw new Error(res.error_message);
                    } else {
                        throw new Error('Unknown server error');
                    }
                }
            } catch (e) {
                MyConsole.Exception('RippleBlockchain::GetAccountTransactions->', e);
            }
        }

        throw new Error('RippleBlockchain::GetAccountTransactions->Request has error');
    }

    async GetFee(): Promise<WalletModel.RippleFee> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            try {
                let res = await RippleServer.GetCurrentFee(this._servers[i]);
                if (res.status == 'success') {
                    return res;
                } else {
                    // If there is any error message
                    if (res.error_message) {
                        throw new Error(res.error_message);
                    } else {
                        throw new Error('Unknown server error');
                    }
                }
            } catch (e) {
                MyConsole.Exception('RippleBlockchain::GetFee->', e);
            }
        }

        throw new Error('RippleBlockchain::GetAddressInfo->Request has error');
    }

    private async foreachServer<T>(
        callback: ProcessServersCallBack<T>,
        errorCallback: ProcessServersError
    ): Promise<T> {
        for (const server of this._servers) {
            try {
                return await callback(server);
            } catch (e: any) {
                errorCallback(e);
            }
        }
        throw new Error('there is no provider that respond to this request');
    }

    private _ensureThereIsAServer() {
        if (this._servers == undefined || this._servers.length == 0) {
            throw new Error('RippleBlockchain::_ensureThereIsAServer->No server');
        }
    }
}
