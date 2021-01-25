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

import { httpclient } from 'typescript-http-client';
import Request = httpclient.Request;
import * as GenericWalletModel from '../../../../../models/GenericWalletModel';
import { BtcFees } from '../bitcoin/BitcoinModel';
import * as WalletModel from '../../../../../models/OmniWalletModel'
import { BitcoinBlockchainAddress } from '../../../../../models/BitcoinWalletModel';

import { 
    ProkeySendTransactionResponse,
} from '../models/ProkeyGenericModel';

export class OmniBlockChain {
    _network = "";
    _propertyId = 0;
    _blockchain = "";

    /**
     * 
     * @param network this is omni coin name, like USDT
     * @param propertyId property id of omni coin
     * @param blockchain this is the base blockchain which omni is running on, like BTC, testbtc and ...
     */
    constructor(network = 'omni', propertyId: number, blockchain = 'btc')
    {
        this._propertyId = propertyId;
        this._network = network;
        this._blockchain = blockchain;
    }

    /**
     * Request: Getting Omni Address Info from blocks.prokey.io
     * @param ReqOmniAddressInfo
     * @returns ResOmniAddressInfo  
     */
    public async GetAddressInfo(reqAddress: GenericWalletModel.RequestAddressInfo): Promise<WalletModel.OmniAddressInfo> {
        let response: WalletModel.OmniAddressInfo = await this.GetFromServer(`address/${this._network}/${this._propertyId}/${reqAddress.address}`);

        return {
            addressModel: reqAddress.addressModel,
            balance: response[0].balance * 100000000,
            trKeys: response[0].trKeys,
        }
    }

    /**
     * 
     * @param reqAddresses Address to get info
     */
    public async GetBaseCoinAddressInfo(reqAddress: string): Promise<BitcoinBlockchainAddress> {
        return new Promise<BitcoinBlockchainAddress>(async (resolve, reject) => {
            if(!reqAddress) {
                return reject("Requested address is null");
            }

            let res = await this.GetFromServer(`address/${this._blockchain}/${reqAddress}`);

            return resolve(res[0]);
        });
    }

    /**
     * 
     * @param hash transaction hash or id seperate each hash or id by comma
     * @returns Omni transaction info 
     */
    public async GetTransaction(hash: string): Promise<Array<WalletModel.OmniTxInfo>> {
        return await this.GetFromServer(`transaction/${this._network}/${this._propertyId}/${hash}`);
    }

    /**
     * Load/Get Transactions list
     * @param addresses List of addresses to get info
     * @param count Number of transaction
     * @param offset Offset of first transaction
     */
    public async GetLatestTransactions(address: WalletModel.OmniAddressInfo, count = 100, offset = 0) : Promise<Array<WalletModel.OmniTxInfo>> {
        return new Promise<Array<WalletModel.OmniTxInfo>>(async (resolve,reject)=>{
            if(address.trKeys == undefined){
                return reject("Transaction Keys' list is empty");
            }
            
            let trs: Array<number> = address.trKeys;
            
            if (count > 1000)
                count = 1000;
            if (offset < 0)
                offset = 0;

            // Sort the tr numbers desc
            trs = trs.sort((a, b) => b - a);
            // Remove the duplicates
            trs = trs.filter((v, pos) => {
                return trs.indexOf(v) == pos;
            });

            count = Math.min(trs.length - offset, count);
            if (count > 0)
            {
                count += offset;
                let ids = "";
                for (let i = offset; i < count; i++)
                {
                    ids += ',' + trs[i];
                }
                ids = ids.substring(1);
                try {
                    let res = await this.GetTransaction(ids);
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

    /**
     * Get Bitcoin transaction fee from server
     * @returns ProkeyResBitcoinFee
     */
    public async GetTxFee(): Promise<BtcFees> {
        const feeUrl = `transaction/fee/${this._blockchain}`;
        return this.GetFromServer(feeUrl);
    }

    /**
     * Send/Broadcast transaction
     * @param data Raw transaction to send to network
     */
    public async BroadCastTransaction(data: string): Promise<ProkeySendTransactionResponse> {
        return this.GetFromServer(`transaction/send/${this._blockchain}/${data}`);
    }

    /**
     * This is a private helper function to GET data from server
     * @param toServer URL + data
     */
    private async GetFromServer(toServer: string) {        

        const client = httpclient.newHttpClient();

        const request = new Request('https://blocks.prokey.org/' + toServer, {method: 'GET'});

        return JSON.parse(await client.execute<string>(request));
    }
}