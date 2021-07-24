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

import { RequestAddressInfo } from '../../../../../models/GenericWalletModel';
import { ProkeySendTransactionResponse } from '../models/ProkeyGenericModel';
import * as WalletModel from '../../../../../models/EthereumWalletModel'
import {ProkeyBaseBlockChain} from "../ProkeyBaseBlockChain";

export class EthereumBlockChain extends ProkeyBaseBlockChain {
    
    _contractAddress: string;
    _isErc20: boolean;
    _network: string;
    constructor(network = "eth", isErc20 = false, contractAddress = '')
    {
        super();
        this._contractAddress = contractAddress.toLowerCase();
        this._isErc20 = isErc20;
        this._network = network;
    }

    /**
     * Request: Getting Ethereum Address Info from blocks.prokey.io
     * @param reqAddress
     * @returns ResEthereumAddressInfo  
     */
    public async GetAddressInfo(reqAddress: RequestAddressInfo): Promise<Array<WalletModel.EthereumAddressInfo>> {
        // Geting Address info from prokey server
        let response : Array<WalletModel.EthereumAddressInfo>;
        if(this._isErc20){
            response = await this.GetFromServer<Array<WalletModel.EthereumAddressInfo>>(`address/${this._network}/erc20/${this._contractAddress}/${reqAddress.address}`);
        } else {
            response = await this.GetFromServer<Array<WalletModel.EthereumAddressInfo>>(`address/${this._network}/${reqAddress.address}`);
        }

        return [{
            balance: response[0].balance,
            nonce: response[0].nonce,
            trKeys: response[0].trKeys,
            addressModel: reqAddress.addressModel,
        }];
    }

    /**
     * Getting transaction information
     * @param id Transaction Key (TrKey) or Transaction HASH
     */
    public async GetTransactions(id: string): Promise<Array<WalletModel.EthereumTransaction>> {
        if(this._isErc20) {
            return await this.GetFromServer<Array<WalletModel.EthereumTransaction>>(`Transaction/${this._network}/erc20/${this._contractAddress}/${id}`);
        } else {
            return await this.GetFromServer<Array<WalletModel.EthereumTransaction>>(`Transaction/${this._network}/${id}`);
        }
    }

    /**
     * Getting the last block number 
     */
    public async GetLastBlockNumber(): Promise<number> {
        return await this.GetFromServer<number>(`Tr/getLastBlock/${this._network}`);
    }

    /**
     * Getting the gas price
     */
    public async GetGasPrice(): Promise<number> {
        return await this.GetFromServer<number>(`transaction/fee/${this._network}`);
    }

    /**
     * Broadcasting a transaction 
     * @param data Transaction data
     */
    public async BroadCastTransaction(data: string): Promise<ProkeySendTransactionResponse> {
        return await this.GetFromServer<ProkeySendTransactionResponse>(`transaction/Send/${this._network}/${data}`);
    }

    public async GetLatestTransactions(trKeys: Array<number>, count = 100, offset = 0) : Promise<Array<any>> {
        return new Promise<Array<WalletModel.EthereumTransaction>>(async (resolve,reject) => {
            if (count > 1000)
                count = 1000;
            if (offset < 0)
                offset = 0;

            // Sort the tr numbers desc
            trKeys = trKeys.sort((a, b) => b - a);
            // Remove the duplicates
            trKeys = trKeys.filter((v, pos) => {
                return trKeys.indexOf(v) == pos;
            });

            count = Math.min(trKeys.length - offset, count);
            if (count > 0)
            {
                count += offset;
                let ids = "";
                for (let i = offset; i < count; i++)
                {
                    ids += ',' + trKeys[i];
                }
                ids = ids.substring(1);
                try {
                    let res = await this.GetTransactions(ids);
                    resolve(res);
                    return;
                } catch (error) {
                    reject(error);
                    return;
                }
            }

            resolve([]);

        });
    }
}

