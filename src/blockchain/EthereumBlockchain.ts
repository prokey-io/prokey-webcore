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

import * as GenericWalletModel from '../models/GenericWalletModel';
import { EthereumBlockChain as ProkeyEthBlockchain } from './servers/prokey/src/ethereum/Ethereum'
import { ProkeySendTransactionResponse } from './servers/prokey/src/models/ProkeyGenericModel';
import { EthereumAccountInfo, EthereumAddressInfo, EthereumTransaction } from '../models/EthereumWalletModel';

export class EthereumBlockchain {
    _prokeyEthBlockchain: ProkeyEthBlockchain;
    constructor(network = 'eth', isErc20 = false, contractAddress = '')
    {
        this._prokeyEthBlockchain = new ProkeyEthBlockchain(network, isErc20, contractAddress);
    }

    /**
     * Request: Getting Ethereum Address Info from blocks.prokey.io
     * @param ReqEthereumAddressInfo
     * @returns ResEthereumAddressInfo  
     */
    public async GetAddressInfo(reqAddress: GenericWalletModel.RequestAddressInfo): Promise<Array<EthereumAddressInfo>> {
        return this._prokeyEthBlockchain.GetAddressInfo(reqAddress);
    }

    /**
     * Getting transaction information
     * @param id Transaction Key (TrKey) or Transaction HASH
     */
    public async GetTransaction(id: string): Promise<Array<EthereumTransaction>> {
        return this._prokeyEthBlockchain.GetTransaction(id);
    }

    /**
     * Getting the last block number 
     */
    public async GetLastBlockNumber(): Promise<number> {
        return this._prokeyEthBlockchain.GetLastBlockNumber();
    }

    /**
     * Getting the gas price
     */
    public async GetGasPrice(): Promise<number> {
        return this._prokeyEthBlockchain.GetGasPrice();
    }

    /**
     * Broadcasting a transaction 
     * @param data Transaction data
     */
    public async SendTransaction(data: string): Promise<ProkeySendTransactionResponse> {
        return await this._prokeyEthBlockchain.SendTransaction(data);
    }

    public async GetLatestTransactions(account: EthereumAccountInfo, count = 10, offset = 0) : Promise<Array<any>> {

        if(!account.trKeys)
        {
            return [];
        }
        return this._prokeyEthBlockchain.GetLatestTransactions(account.trKeys, count, offset);
    }
}