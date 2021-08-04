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

import {
    BtcFees,
} from './BitcoinModel'

import * as WalletModel from '../../../../../models/BitcoinWalletModel'

import { httpclient } from 'typescript-http-client'
import Request = httpclient.Request
import { ProkeySendTransactionResponse } from '../models/ProkeyGenericModel';
import { RequestAddressInfo } from '../../../../../models/GenericWalletModel';
import {ProkeyBaseBlockChain} from "../ProkeyBaseBlockChain";
import {BitcoinFee} from "../../../../../models/BitcoinWalletModel";
import {CoinBaseType, CoinInfo} from "../../../../../coins/CoinInfo";
import {BitcoinBaseCoinInfoModel} from "../../../../../models/CoinInfoModel";


export class BitcoinBlockChain extends ProkeyBaseBlockChain {
    _coinName: string;

    // Constructor
    constructor(coinName: string)
    {
        super();
        this._coinName = coinName;
    }

    /**
     * Request: Getting Bitcoin Address Info from blocks.prokey.io
     * @param reqAddresses an Array of ReqBitcoinAddressInfo
     * @returns BitcoinAddressInfo an Array of BitcoinAddressInfo
     */
    public async GetAddressInfo(reqAddresses: Array<RequestAddressInfo>): Promise<Array<WalletModel.BitcoinAddressInfo>> {
        return new Promise<Array<WalletModel.BitcoinAddressInfo>>(async (resolve,reject)=>{
            if(reqAddresses.length > 20) {
                reject("The max number of req is 20");
                return;
            }
            if (reqAddresses.length == 0) {
                reject("The requested addresses is empty");
                return;
            }

            let response: Array<WalletModel.BitcoinAddressInfo> = new Array<WalletModel.BitcoinAddressInfo>();

            // address/coin_name/addresses
            try {
                let addresses: string = "";
                reqAddresses.forEach(req => {
                    addresses += "," + req.address;
                });
                addresses = addresses.substring(1);

                var prokeyRes: Array<WalletModel.BitcoinBlockchainAddress> = await this.PostToServer<Array<WalletModel.BitcoinBlockchainAddress>>(`address/${this._coinName}/${addresses}`, null);

                if(prokeyRes){
                    let n = 0;
                    prokeyRes.forEach(fullAddress => {
                        let a: WalletModel.BitcoinAddressInfo = {
                            address: reqAddresses[n].address,
                            addressModel: reqAddresses[n].addressModel,
                            balance: fullAddress.totalReceive - fullAddress.totalSent,
                            exist: fullAddress.totalReceive > 0,
                            txInfo: fullAddress,
                        };

                        response.push(a);
                        
                        n++;
                    });  
                    resolve(response);        
                    return;            
                } else {
                    reject("Get bulk address from server failed");
                    return;
                }
            } catch (ex) {
                console.log(ex);
                reject(ex);
                return;
            }
        });
    }

    /**
     * 
     * @param hash transaction hash or id seperate each hash or id by comma
     * @returns Bitcoin transaction info 
     */
    public async GetTransactions(hash: string): Promise<Array<WalletModel.BitcoinTxInfo>> {
        return new Promise<Array<WalletModel.BitcoinTxInfo>>(async (resolve,reject)=>{
            try {
                let res = await this.CustomGet<Array<WalletModel.BitcoinTxInfo>>(`Transaction/${this._coinName}/${hash}`);

                res.forEach(tx => {
                    tx.inputs.forEach(inp => {
                        inp.valueNumber = +inp.value;
                    });

                    tx.outputs.forEach(out => {
                        out.valueNumber = +out.value;
                    })
                });

                resolve(res);
            }
            catch(ex) {
                reject(ex);
            } 
        });
    }

    /**
     * Load/Get Transactions list
     * @param addresses List of addresses to get info
     * @param count Number of transaction
     * @param offset Offset of first transaction
     */
    public async GetLatestTransactions(addresses: Array<WalletModel.BitcoinAddressInfo>, count = 100, offset = 0) : Promise<Array<WalletModel.BitcoinTxInfo>> {
        return new Promise<Array<WalletModel.BitcoinTxInfo>>(async (resolve,reject)=>{
            let trs: Array<number | string> = [];
            addresses.forEach(add => {
                if (add.txInfo.transactionIds) {
                    add.txInfo.transactionIds.forEach(tr => {
                        trs.push(tr);
                    });
                }
                else if (add.txInfo.transactions) {
                    add.txInfo.transactions.forEach(tr => {
                        trs.push(tr.txId);
                    });
                }
            });

            if (count > 1000)
                count = 1000;
            if (offset < 0)
                offset = 0;

            // Sort the tr numbers desc
            if (typeof trs[0] == "number") {
                trs = trs.sort((a, b) => <number>b - <number>a);
                // Remove the duplicates
                trs = trs.filter((v, pos) => {
                    return trs.indexOf(v) == pos;
                });
            }

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
        return this.CustomGet<BtcFees>('Transaction/fee/' + this._coinName );
    }

    public async BroadCastTransaction(data: string): Promise<ProkeySendTransactionResponse> {
        return this.CustomGet<ProkeySendTransactionResponse>(`Transaction/send/${this._coinName}/${data}`);
    }

    /**
     * Get Bitcoin transaction fee from server
     * @returns BitcoinFee
     */
    public async GetTxFee(): Promise<BitcoinFee> {
        var fee = <BitcoinFee>{};
        if (this._coinName === 'BTC')
        {
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
        }


        //! Get fee from prokey servers
        var fees = await this.GetTxFeeFromServer();

        // BTC -> Satoshi/Byte
        fee.economy = fees.ecoFees[5].feerate * 100000;
        fee.normal = fees.fees[3].feerate * 100000;
        fee.high = fees.fees[1].feerate * 100000;


        // Server may return the negative fee, so we should use the next returned fee
        if (fee.high < 0)
            fee.high = fees.fees[2].feerate * 100000;

        if (fee.high < 0)
        {
            // We need to use the fee from coin info
            // satoshi/kB -> satoshi/Byte
            fee.high = fee.normal = fee.economy = CoinInfo.Get<BitcoinBaseCoinInfoModel>( this._coinName, CoinBaseType.BitcoinBase).minfee_kb / 1000;
        }

        return fee;
    }

    private async CustomGet<T>(toServer: string): Promise<T> {
        return await this.GetFromServer<T>(toServer, json => json.replace(new RegExp('"value":([0-9]+),',"g"),'"value":"$1",'));
    }
}
