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

export class BitcoinBlockchain extends BlockchainBase {
    

    constructor(servers: BlockchainServerModel[]) {
        super(servers);
    }

    public GetAddressInfo(reqAdd: RequestAddressInfo) {

    }

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
                try
                {
                    return await BlockbookServer.GetAccount(this._servers[i], publicKey, req);
                }
                catch(e){
                    MyConsole.Exception("BitcoinBlockchain::GetAccountInfoByPublicKey->",e);
                }
            }
        };

        throw new Error("BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request");
    }

    public GetAccountInfoByAddresses(addresses: RequestAddressInfo[]) {
        

    }

    public async BroadCastTransaction(transaction: string): Promise<BlockbookTransactionResult> {
        this._ensureThereIsAServer();
        for(let i=0; i<this._servers.length; i++){
            if(this._servers[i].apiType == "blockbook"){
                try {
                    return await BlockbookServer.BroadcastTransaction(this._servers[i], transaction);
                }
                catch(e) {
                    MyConsole.Exception("BitcoinBlockchain::GetAccountInfoByPublicKey->",e);
                }
            }
        }

        throw new Error("BitcoinBlockchain::GetAccountInfoByPublicKey->No server to handle the request");
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
                        fee.high = +res.result * 10000; // satoshi per KB
                    }

                    res = await BlockbookServer.GetEstimateFee(this._servers[i], 3);
                    if(res.result) {
                        fee.normal = +res.result * 10000; // satoshi per KB
                    }

                    res = await BlockbookServer.GetEstimateFee(this._servers[i], 6);
                    if(res.result) {
                        fee.economy = +res.result * 10000; // satoshi per KB
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
