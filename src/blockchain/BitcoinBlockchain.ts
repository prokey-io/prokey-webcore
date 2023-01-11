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

import { BlockchainBase } from './BlockchainBase';
import * as WalletModel from '../models/BitcoinWalletModel';
import { RequestAddressInfo } from '../models/GenericWalletModel';
import { BlockchainServerModel } from './BlockchainProviders';
import { BlockbookServer } from './_servers/blockbook/BlockbookServer';
import {
    BlockbookDetails,
    BlockbookRequestDetails,
    BlockbookTokens,
} from './_servers/blockbook/BlockbookRequestModels';
import { MyConsole } from '../utils/console';
import { AddressModel } from '../models/Prokey';
import * as PathUtil from '../utils/pathUtils';
import * as GenericWalletModel from '../models/GenericWalletModel';
import * as BlockbookModels from './_servers/blockbook/BlockbookBitcoinModel';
import { Request, newHttpClient } from 'typescript-http-client';
import { BitcoinWallet } from '../wallet/BitcoinWallet';

export class BitcoinBlockchain extends BlockchainBase {
    _lastFeeFetchTime: Date = new Date();
    _lastFee: WalletModel.BitcoinFee = <WalletModel.BitcoinFee>{};

    constructor(servers: BlockchainServerModel[]) {
        super(servers);

        //! Initial time to yesterday
        this._lastFeeFetchTime.setDate(this._lastFeeFetchTime.getDate() - 1);
    }

    /**
     * Get address info
     * @param reqAdd The address
     * @returns Bitcoin Address Info
     */
    public async GetAddressInfo(
        reqAdd: AddressModel,
        isIncludeTransactionData = true
    ): Promise<WalletModel.BitcoinAddressInfoModel> {
        this._ensureThereIsAServer();

        for (let i = 0; i < this._servers.length; i++) {
            if (this._servers[i].apiType == 'blockbook') {
                const reqDetails = new BlockbookRequestDetails();
                if (isIncludeTransactionData) {
                    reqDetails.details = BlockbookDetails.Txs;
                }

                try {
                    let addInfo: WalletModel.BitcoinAddressInfoModel =
                        await BlockbookServer.GetAddressInfo<BlockbookModels.BitcoinAddressInfoModel>(
                            this._servers[i],
                            reqAdd.address,
                            reqDetails
                        );

                    //! Add address model
                    addInfo.addressModel = reqAdd;

                    return addInfo;
                } catch (e) {
                    MyConsole.Exception('BitcoinBlockchain::GetAddressInfo->', e);
                }
            }
        }

        throw new Error('BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request');
    }

    /**
     * Get account information using public key
     * @param publicKey The extended public key
     * @returns Bitcoin account info
     */
    public async GetAccountInfoByPublicKey(publicKey: string): Promise<WalletModel.BitcoinAccountInfo> {
        this._ensureThereIsAServer();

        for (let i = 0; i < this._servers.length; i++) {
            if (this._servers[i].isSupportXpub != true) continue;

            if (this._servers[i].apiType == 'blockbook') {
                const req = new BlockbookRequestDetails();
                req.details = BlockbookDetails.Txs;
                req.tokens = BlockbookTokens.Used;

                // in case of any error, try the next server
                try {
                    let accInfo: WalletModel.BitcoinAccountInfo = await BlockbookServer.GetAccount(
                        this._servers[i],
                        publicKey,
                        req
                    );

                    // pars token data
                    if (accInfo.tokens && accInfo.tokens.length > 0) {
                        accInfo.addresses = [];
                        accInfo.changeAddresses = [];
                        accInfo.tokens
                            .filter((t) => t.type == 'XPUBAddress')
                            .forEach((t) => {
                                let path = PathUtil.getHDPath(t.path);
                                // Set change addresses
                                if (PathUtil.IsChangePath(path)) {
                                    accInfo.changeAddresses?.push({
                                        address: t.name,
                                        path: path,
                                    });
                                }
                                // Set addresses
                                else {
                                    accInfo.addresses?.push({
                                        address: t.name,
                                        path: path,
                                    });
                                }
                            });
                    }

                    return accInfo;
                } catch (e) {
                    MyConsole.Exception('BitcoinBlockchain::GetAccountInfoByPublicKey->', e);
                }
            }
        }

        throw new Error('BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request');
    }

    /**
     * Get bitcoin transaction data in the exact format as returned by backend
     * @param transactionId Transaction ID
     */
    public async GetRawTransaction(transactionId: string): Promise<WalletModel.BitcoinTransactionDetailInfoModel> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) { 
            if (this._servers[i].apiType == 'blockbook') {
                let txInfo = await BlockbookServer.GetRawTransaction(this._servers[i], transactionId);

                return txInfo;
            }
        }

        throw new Error('BitcoinBlockchain::GetRawTransaction->No server to handle the request');
    }

    /**
     * Get account utxo by public key
     * @param publicKey The extended public key
     * @returns List of UTXO
     */
    public async GetAccountUtxoByPublicKey(publicKey: string): Promise<WalletModel.BitcoinUtxoModel[]> {
        for (let i = 0; i < this._servers.length; i++) {
            if (this._servers[i].isSupportXpub != true) {
                continue;
            }

            if (this._servers[i].apiType == 'blockbook') {
                // in case of any error, try the next server
                try {
                    let utxos: WalletModel.BitcoinUtxoModel[] = await BlockbookServer.GetUtxo(
                        this._servers[i],
                        publicKey
                    );

                    return utxos;
                } catch (e) {
                    MyConsole.Exception('BitcoinBlockchain::GetAccountUtxoByPublicKey->', e);
                }
            }
        }

        throw new Error('BitcoinBlockchain::GetAccountUtxoByPublicKey->No server to handle the request');
    }

    /**
     * Get account utxo by public key
     * @param publicKey The extended public key
     * @returns List of UTXO
     */
    public async GetAddressUtxo(address: string): Promise<WalletModel.BitcoinUtxoModel[]> {
        for (let i = 0; i < this._servers.length; i++) {
            if (this._servers[i].isSupportXpub != true) {
                continue;
            }

            if (this._servers[i].apiType == 'blockbook') {
                // in case of any error, try the next server
                try {
                    let utxos: WalletModel.BitcoinUtxoModel[] = await BlockbookServer.GetUtxo(
                        this._servers[i],
                        address
                    );

                    return utxos;
                } catch (e) {
                    MyConsole.Exception('BitcoinBlockchain::GetAddressUtxo->', e);
                }
            }
        }

        throw new Error('BitcoinBlockchain::GetAddressUtxo->No server to handle the request');
    }

    /**
     * Get account info by addresses
     * @param addresses
     */
    public GetAccountInfoByAddresses(addresses: RequestAddressInfo[]) {}

    /**
     * Send new transaction to network
     * @param transaction raw signed transaction to be sent
     * @returns Send transaction result
     */
    public async BroadCastTransaction(transaction: string): Promise<GenericWalletModel.GenericSentTransactionResult> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            if (this._servers[i].apiType == 'blockbook') {
                try {
                    const result = await BlockbookServer.BroadcastTransaction(this._servers[i], transaction);
                    if (result.result) {
                        return {
                            isSuccess: true,
                            txid: result.result,
                        };
                    } else if (result.error) {
                        return {
                            isSuccess: false,
                            error: result.error,
                        };
                    } else {
                        MyConsole.Info(
                            'BitcoinBlockchain::BroadCastTransaction->Send transaction neither have result or error'
                        );
                        return {
                            isSuccess: false,
                            error: 'Send transaction neither have result or error',
                        };
                    }
                } catch (e) {
                    MyConsole.Exception('BitcoinBlockchain::BroadCastTransaction->', e);
                }
            }
        }

        throw new Error('BitcoinBlockchain::BroadCastTransaction->No server to handle the request');
    }

    public async GetZcashChainId() {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            if (this._servers[i].apiType == 'blockbook') {
                try {
                    const result = await BlockbookServer.GetZcashChainId(this._servers[i]);
                    if (result.backend) {
                        return {
                            isSuccess: true,
                            chainId: result.backend.consensus.chaintip,
                        };
                    } else {
                        return {
                            isSuccess: false,
                            error: 'GetZcashChainId have error',
                        };
                    }
                } catch (e) {
                    MyConsole.Exception('BitcoinBlockchain::BroadCastTransaction->', e);
                }
            }
        }

        throw new Error('BitcoinBlockchain::GetZcashChainId->No server to handle the request');
    }

    public async GetTxFee(isBitcoin: boolean): Promise<WalletModel.BitcoinFee> {
        //! fetch/update the fee rate every 1 minutes
        const secondsPassedFromLastCall = (new Date().getTime() - this._lastFeeFetchTime.getTime()) / 1000;
        if (this._lastFee != null && secondsPassedFromLastCall < 60) {
            return this._lastFee;
        }

        if (isBitcoin == false) {
            return await this._getTxEstimatedFee();
        }

        try {
            var fee = <WalletModel.BitcoinFee>{};
            // get fee from https://bitcoinfees.earn.com/api/v1/fees/list
            const client = newHttpClient();

            const request = new Request('https://bitcoinfees.earn.com/api/v1/fees/list', { method: 'GET' });
            var r = await client.execute<any>(request);
            r.fees.forEach((element) => {
                if (
                    (element.maxMinutes == 360 && fee.economy == null) ||
                    (element.minMinutes < 180 && fee.economy == null)
                ) {
                    fee.economy = element.minFee;
                } else if (
                    (element.maxMinutes == 180 && fee.normal == null) ||
                    (element.minMinutes < 90 && fee.normal == null)
                ) {
                    fee.normal = element.minFee;
                } else if (
                    (element.maxMinutes == 60 && fee.high == null) ||
                    (element.minMinutes < 30 && fee.high == null)
                ) {
                    fee.high = element.minFee;
                }
            });

            this._lastFee = fee;
            return fee;
        } catch {
            return this._getTxEstimatedFee();
        }
    }

    //**********************
    // PRIVATE FUNCTIONS
    //**********************
    private _ensureThereIsAServer() {
        if (this._servers == undefined || this._servers.length == 0) {
            throw new Error('BitcoinBlockchain::_ensureThereIsAServer->No server');
        }
    }

    private async _getTxEstimatedFee(): Promise<WalletModel.BitcoinFee> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            if (this._servers[i].apiType == 'blockbook') {
                try {
                    let fee: WalletModel.BitcoinFee = {
                        economy: 0,
                        high: 0,
                        normal: 0,
                    };

                    let res = await BlockbookServer.GetEstimateFee(this._servers[i], 1);
                    if (res.result) {
                        fee.high = +res.result * 100000; // satoshi per KB
                    }

                    res = await BlockbookServer.GetEstimateFee(this._servers[i], 3);
                    if (res.result) {
                        fee.normal = +res.result * 100000; // satoshi per KB
                    }

                    res = await BlockbookServer.GetEstimateFee(this._servers[i], 6);
                    if (res.result) {
                        fee.economy = +res.result * 100000; // satoshi per KB
                    }

                    this._lastFee = fee;
                    return fee;
                } catch (e) {}
            }
        }

        throw new Error('BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request');
    }
}
