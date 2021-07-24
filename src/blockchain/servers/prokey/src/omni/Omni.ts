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

import * as GenericWalletModel from '../../../../../models/GenericWalletModel';
import { BtcFees } from '../bitcoin/BitcoinModel';
import * as WalletModel from '../../../../../models/OmniWalletModel'
import {BitcoinBlockchainAddress, BitcoinFee} from '../../../../../models/BitcoinWalletModel';

import { 
    ProkeySendTransactionResponse,
} from '../models/ProkeyGenericModel';
import {ProkeyBaseBlockChain} from "../ProkeyBaseBlockChain";
import {httpclient} from "typescript-http-client";
import {CoinBaseType, CoinInfo} from "../../../../../coins/CoinInfo";
import {BitcoinBaseCoinInfoModel} from "../../../../../models/CoinInfoModel";
import Request = httpclient.Request

export class OmniBlockChain extends ProkeyBaseBlockChain {
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
        super();
        this._propertyId = propertyId;
        this._network = network;
        this._blockchain = blockchain;
    }

    /**
     * Request: Getting Omni Address Info from blocks.prokey.io
     * @returns ResOmniAddressInfo
     */
    public async GetAddressInfo(reqAddress: GenericWalletModel.RequestAddressInfo): Promise<WalletModel.OmniAddressInfo> {
        let response: WalletModel.OmniAddressInfo = await this.GetFromServer<WalletModel.OmniAddressInfo>(`address/${this._network}/${this._propertyId}/${reqAddress.address}`);

        return {
            addressModel: reqAddress.addressModel,
            balance: response[0].balance,
            trKeys: response[0].trKeys,
        }
    }

    /**
     * 
     * @param reqAddress Address to get info
     */
    public async GetBaseCoinAddressInfo(reqAddress: string): Promise<BitcoinBlockchainAddress> {
        return new Promise<BitcoinBlockchainAddress>(async (resolve, reject) => {
            if(!reqAddress) {
                return reject("Requested address is null");
            }

            let res = await this.GetFromServer<BitcoinBlockchainAddress>(`address/${this._blockchain}/${reqAddress}`);

            return resolve(res[0]);
        });
    }

    /**
     * 
     * @param hash transaction hash or id seperate each hash or id by comma
     * @returns Omni transaction info 
     */
    public async GetTransactions(hash: string): Promise<Array<WalletModel.OmniTxInfo>> {
        return await this.GetFromServer<Array<WalletModel.OmniTxInfo>>(`transaction/${this._network}/${this._propertyId}/${hash}`);
    }

    /**
     * Load/Get Transactions list
     * @param trs List of transaction ids
     * @param count Number of transaction
     * @param offset Offset of first transaction
     */
    public async GetLatestTransactions(trs: Array<number>, count = 100, offset = 0) : Promise<Array<WalletModel.OmniTxInfo>> {
        return new Promise<Array<WalletModel.OmniTxInfo>>(async (resolve,reject)=>{
            if(trs == undefined){
                return reject("Transaction Keys' list is empty");
            }
            
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

    /**
     * Get Bitcoin transaction fee from server
     * @returns ProkeyResBitcoinFee
     */
    public async GetTxFeeFromServer(): Promise<BtcFees> {
        const feeUrl = `transaction/fee/${this._blockchain}`;
        return this.GetFromServer<BtcFees>(feeUrl);
    }

    public async GetTxFee(): Promise<BitcoinFee> {
        var fees = await this.GetTxFeeFromServer();
        var fee = <BitcoinFee>{};

        try {

            // get fee from https://bitcoinfees.earn.com/api/v1/fees/list
            const client = httpclient.newHttpClient();

            const request = new Request("https://bitcoinfees.earn.com/api/v1/fees/list", {method: 'GET'});

            var r = await client.execute<any>(request);
            r.fees.forEach(element => {
                if (element.maxMinutes == 360 && fee.economy == null) {
                    fee.economy = element.minFee;
                } else if (element.maxMinutes == 180 && fee.normal == null) {
                    fee.normal = element.minFee;
                } else if (element.maxMinutes == 60 && fee.high == null) {
                    fee.high = element.minFee;
                }
            });

            return fee;
        }
        catch (error) {
        }

        fee.economy = fees.ecoFees[5].feerate * 100000;
        fee.normal = fees.fees[3].feerate * 100000;
        fee.high = fees.fees[1].feerate * 100000;

        // Server may return the negative fee, so we should use the next returned fee
        if (fee.high < 0)
            fee.high = fees.fees[2].feerate * 100000;
        if (fee.high < 0)
        {
            // We need to use the fee from coin info
            fee.high = fee.normal = fee.economy = CoinInfo.Get<BitcoinBaseCoinInfoModel>( "Bitcoin", CoinBaseType.BitcoinBase).minfee_kb;
        }

        return fee;
    }

    /**
     * Send/Broadcast transaction
     * @param data Raw transaction to send to network
     */
    public async BroadCastTransaction(data: string): Promise<ProkeySendTransactionResponse> {
        return this.GetFromServer<ProkeySendTransactionResponse>(`transaction/send/${this._blockchain}/${data}`);
    }
}