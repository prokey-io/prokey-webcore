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
import * as WalletModel from '../models/EthereumWalletModel'
import { RequestAddressInfo } from '../models/GenericWalletModel';
import { BlockchainServerModel } from './BlockchainProviders';
import { BlockbookServer } from './_servers/blockbook/BlockbookServer';
import { BlockbookDetails, BlockbookRequestDetails, BlockbookTokens } from './_servers/blockbook/BlockbookRequestModels';
import { MyConsole } from '../utils/console';
import { AddressModel } from '../models/Prokey';
import * as PathUtil from '../utils/pathUtils';
import * as GenericWalletModel from '../models/GenericWalletModel'
import * as BlockbookModels from './_servers/blockbook/BlockbookEthereumModel'

export class EthereumBlockchain extends BlockchainBase {
    private _isErc20: boolean;
    private _contractAddress?: string;

    constructor(servers: BlockchainServerModel[], isErc20 = false, contractAddress?: string) {
        super(servers);

        this._isErc20 = isErc20;
        this._contractAddress = contractAddress;
    }

    /**
     * Get address info
     * @param reqAdd The address
     * @returns Bitcoin Address Info
     */
    public async GetAddressInfo(reqAdd: AddressModel): Promise<WalletModel.EthereumAccountInfo> {
        this._ensureThereIsAServer();
        for(let i=0; i<this._servers.length; i++) {
            if(this._servers[i].apiType == "blockbook") {
                const req = new BlockbookRequestDetails();
                req.details = BlockbookDetails.Txs;

                try {
                    let addInfo: WalletModel.EthereumAccountInfo = await BlockbookServer.GetAddressInfo<BlockbookModels.EthereumAddressModel>(this._servers[i], reqAdd.address, req);
                    
                    //! Add address model
                    addInfo.addressModel = reqAdd;

                    return addInfo;
                }
                catch(e){
                    MyConsole.Exception("EthereumBlockchain::GetAddressInfo->", e);
                }
            }
        }

        throw new Error("EthereumBlockchain::GetAddressInfo->No server to handle the request");
    }

    public async GetGasPrice(): Promise<number> {
        return 0;
    }

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
                    } 
                    else {
                        MyConsole.Info("EthereumBlockchain::BroadCastTransaction->Send transaction neither have result or error");
                        return {
                            isSuccess: false,
                            error: "Send transaction neither have result or error"
                        }
                    }
                }
                catch(e) {
                    MyConsole.Exception("EthereumBlockchain::BroadCastTransaction->",e);
                }
            }
        }

        throw new Error("EthereumBlockchain::BroadCastTransaction->No server to handle the request");
    }

    //**********************
    // PRIVATE FUNCTIONS
    //**********************
    private _ensureThereIsAServer() {
        if(this._servers == undefined || this._servers.length == 0) {
            throw new Error("EthereumBlockchain::_ensureThereIsAServer->No server")
        }
    }
}