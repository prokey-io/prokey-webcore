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
    BitcoinTxInfo,
    BitcoinAddressInfo,
    BitcoinFee,
} from '../models/BitcoinWalletModel';

import { BitcoinBlockChain } from './servers/prokey/src/bitcoin/Bitcoin';
import { ProkeySendTransactionResponse } from './servers/prokey/src/models/ProkeyGenericModel';
import * as GenericWalletModel from '../models/GenericWalletModel';
import { CoinBaseType, CoinInfo } from '../coins/CoinInfo';
import { BitcoinBaseCoinInfoModel } from '../models/CoinInfoModel'
import { httpclient } from 'typescript-http-client'
import Request = httpclient.Request
import { MyConsole } from '../utils/console';

export class BitcoinBlockchain {

    _prokeyBtcBlockchain: BitcoinBlockChain;
    _coinName: string;

    constructor(coinName: string)
    {
        this._coinName = coinName;
        this._prokeyBtcBlockchain = new BitcoinBlockChain(coinName);
    }

    /**
     * Request: Getting Bitcoin Address Info
     * @param List of BitcoinRequestAddressInfo
     * @returns List of BitcoinAddressInfo  
     */
    public async GetAddressInfo(reqAddresses: Array<GenericWalletModel.RequestAddressInfo>): Promise<Array<BitcoinAddressInfo>> {
        return this._prokeyBtcBlockchain.GetAddressInfo(reqAddresses);
    }

    /**
     * 
     * @param hash transaction hash or id seperate each input with ,
     * @returns Bitcoin transaction info array
     */
    public async GetTransactions(hash: string): Promise<Array<BitcoinTxInfo>> {
        return this._prokeyBtcBlockchain.GetTransactions(hash);
    }

    public async GetLatestTransactions(addresses: Array<BitcoinAddressInfo>, count = 10, offset = 0) : Promise<Array<BitcoinTxInfo>> {
        return this._prokeyBtcBlockchain.GetLatestTransactions(addresses, count, offset);
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

                MyConsole.Info("Current bitcoinfees fee rates", fee);
                return fee;
            }
            catch (error) {
            }
        }
        
        
        var fees = await this._prokeyBtcBlockchain.GetTxFee();
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
            fee.high = fee.normal = fee.economy = CoinInfo.Get<BitcoinBaseCoinInfoModel>( this._prokeyBtcBlockchain._coinName, CoinBaseType.BitcoinBase).minfee_kb / 1000;
        }

        MyConsole.Info("Current server fee rates", fee);

        return fee;
    }

    /**
     * Broadcast a transaction to the network
     * @param txData Data to be broadcasted
     */
    public async BroadcastTransaction(txData: string): Promise<ProkeySendTransactionResponse> {
        return this._prokeyBtcBlockchain.BroadCastTransaction(txData);
    }

}