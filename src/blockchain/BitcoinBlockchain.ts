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

import { BlockchainBase } from './BlockchainBase'
import * as WalletModel from '../models/BitcoinWalletModel'
import { RequestAddressInfo } from '../models/GenericWalletModel';
import { BlockchainServerModel } from './BlockchainProviders';
import { BlockbookServer } from './_servers/blockbook/BlockbookServer';
import { BlockbookDetails, BlockbookRequestDetails, BlockbookTokens } from './_servers/blockbook/BlockbookRequestModels';
import { MyConsole } from '../utils/console';
import { BlockbookTransactionResult } from './_servers/blockbook/BlockbookCommonModel';
import { AddressModel } from '../models/Prokey';
import * as PathUtil from '../utils/pathUtils';
import * as GenericWalletModel from '../models/GenericWalletModel'

export class BitcoinBlockchain extends BlockchainBase {
    
    constructor(servers: BlockchainServerModel[]) {
        super(servers);
    }

    /**
     * Get address info
     * @param reqAdd The address
     * @returns Bitcoin Address Info
     */
    public async GetAddressInfo(reqAdd: AddressModel): Promise<WalletModel.BitcoinAddressInfoModel> {
        this._ensureThereIsAServer();
        for(let i=0; i<this._servers.length; i++) {
            if(this._servers[i].apiType == "blockbook") {
                const req = new BlockbookRequestDetails();
                req.details = BlockbookDetails.Txs;

                try {
                    let addInfo: WalletModel.BitcoinAddressInfoModel = await BlockbookServer.GetAddressInfo(this._servers[i], reqAdd.address);
                    
                    //! Add address model
                    addInfo.addressModel = reqAdd;

                    return addInfo;
                }
                catch(e){
                    MyConsole.Exception("BitcoinBlockchain::GetAddressInfo->",e);
                }
            }
        }

        throw new Error("BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request");
    }

    /**
     * Get account information using public key
     * @param publicKey The extended public key
     * @returns Bitcoin account info
     */
    public async GetAccountInfoByPublicKey(publicKey: string): Promise<WalletModel.BitcoinAccountInfo> {
        this._ensureThereIsAServer();

        for(let i=0; i<this._servers.length; i++){
            if(this._servers[i].isSupportXpub != true)
                continue;

            if(this._servers[i].apiType == "blockbook"){
                const req = new BlockbookRequestDetails();
                req.details = BlockbookDetails.Txs;
                req.tokens = BlockbookTokens.Used;

                // in case of any error, try the next server
                try {
                    let accInfo: WalletModel.BitcoinAccountInfo = await BlockbookServer.GetAccount(this._servers[i], publicKey, req);
                    
                    // pars token data
                    if(accInfo.tokens && accInfo.tokens.length > 0) {
                        accInfo.addresses = [];
                        accInfo.changeAddresses = [];
                        accInfo.tokens.filter(t => t.type == "XPUBAddress").forEach(t => {
                            let path = PathUtil.getHDPath(t.path);
                            // Set change addresses
                            if(PathUtil.IsChangePath(path)){
                                accInfo.changeAddresses?.push({
                                    address: t.name,
                                    path: path
                                });
                            }
                            // Set addresses 
                            else {
                                accInfo.addresses?.push({
                                    address: t.name,
                                    path: path,
                                })
                            }
                        });
                    }

                    return accInfo;

                }
                catch(e){
                    MyConsole.Exception("BitcoinBlockchain::GetAccountInfoByPublicKey->",e);
                }
            }
        };

        throw new Error("BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request");
    }

    /**
     * Get account utxo by public key
     * @param publicKey The extended public key
     * @returns List of UTXO
     */
    public async GetAccountUtxoByPublicKey(publicKey: string): Promise<WalletModel.BitcoinUtxoModel[]> {
        for(let i=0; i<this._servers.length; i++){
            if(this._servers[i].isSupportXpub != true)
                continue;
            
            if(this._servers[i].apiType == "blockbook"){
                // in case of any error, try the next server
                try {
                    let utxos: WalletModel.BitcoinUtxoModel[] = await BlockbookServer.GetUtxo(this._servers[i], publicKey);

                    return utxos;
                } 
                catch(e) {
                    MyConsole.Exception("BitcoinBlockchain::GetAccountUtxoByPublicKey->",e);
                }
            }
        }

        throw new Error("BitcoinBlockchain::GetAccountUtxoByPublicKey->No server to handle the request");
    }

    /**
     * Get account info by addresses
     * @param addresses 
     */
    public GetAccountInfoByAddresses(addresses: RequestAddressInfo[]) {
    }

    /**
     * Send new transaction to network
     * @param transaction raw signed transaction to be sent
     * @returns Send transaction result
     */
    public async BroadCastTransaction(transaction: string): Promise<GenericWalletModel.GenericSentTransactionResult> {
        this._ensureThereIsAServer();
        for(let i=0; i<this._servers.length; i++){
            if(this._servers[i].apiType == "blockbook"){
                try {
                    const result = await BlockbookServer.BroadcastTransaction(this._servers[i], transaction);
                    if(result.result) {
                        return {
                            isSuccess: true,
                            txid: result.result,
                        }
                    }
                    else if(result.error) {
                        return {
                            isSuccess: false,
                            error: result.error,
                        }
                    } else {
                        MyConsole.Info("BitcoinBlockchain::BroadCastTransaction->Send transaction neither have result or error");
                        return {
                            isSuccess: false,
                            error: "Send transaction neither have result or error"
                        }
                    }
                }
                catch(e) {
                    MyConsole.Exception("BitcoinBlockchain::BroadCastTransaction->",e);
                }
            }
        }

        throw new Error("BitcoinBlockchain::BroadCastTransaction->No server to handle the request");
    }

    public async GetTxFee(): Promise<WalletModel.BitcoinFee> {
        this._ensureThereIsAServer();
        for(let i=0; i<this._servers.length; i++){
            if(this._servers[i].apiType == "blockbook"){
                try {
                    let fee : WalletModel.BitcoinFee = {
                        economy: 0,
                        high: 0,
                        normal: 0,
                    };

                    let res = await BlockbookServer.GetEstimateFee(this._servers[i], 1);
                    if(res.result) {
                        fee.high = +res.result * 100000; // satoshi per KB
                    }

                    res = await BlockbookServer.GetEstimateFee(this._servers[i], 3);
                    if(res.result) {
                        fee.normal = +res.result * 100000; // satoshi per KB
                    }

                    res = await BlockbookServer.GetEstimateFee(this._servers[i], 6);
                    if(res.result) {
                        fee.economy = +res.result * 100000; // satoshi per KB
                    }

                    return fee;
                } 
                catch(e) {

                }
            }
        }

        throw new Error("BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request");
    }

    //**********************
    // PRIVATE FUNCTIONS
    //**********************
    private _ensureThereIsAServer() {
        if(this._servers == undefined || this._servers.length == 0) {
            throw new Error("BitcoinBlockchain::_ensureThereIsAServer->No server")
        }
    }

}
