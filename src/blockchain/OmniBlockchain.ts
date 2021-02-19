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

import { OmniBlockChain as ProkeyOmniBlockchain }  from './servers/prokey/src/omni/Omni';
import { ProkeySendTransactionResponse } from './servers/prokey/src/models/ProkeyGenericModel';
import * as GenericWalletModel from '../models/GenericWalletModel';

import { OmniAddressInfo, OmniTxInfo } from '../models/OmniWalletModel';
import { BitcoinBlockchainAddress } from '../models/BitcoinWalletModel';
import { BitcoinFee } from '../models/BitcoinWalletModel';
import { CoinBaseType, CoinInfo } from '../coins/CoinInfo';
import { BitcoinBaseCoinInfoModel } from '../models/CoinInfoModel'
import { httpclient } from 'typescript-http-client'
import Request = httpclient.Request

export class OmniBlockchain {
    _prokeyOmniBlockchain: ProkeyOmniBlockchain;

    constructor(network='omni', propertyId: number,  blockchain = 'BTC') {
        this._prokeyOmniBlockchain = new ProkeyOmniBlockchain(network, propertyId, blockchain);
    }

    /**
     * Get Address Information from Prokey servers
     * @param reqAddress Requested address
     */
    public async GetAddressInfo(reqAddress: GenericWalletModel.RequestAddressInfo): Promise<OmniAddressInfo> {
        return await this._prokeyOmniBlockchain.GetAddressInfo(reqAddress);
    }

    public async GetBaseCoinAddressInfo(reqAddress: string): Promise<BitcoinBlockchainAddress>{
        return await this._prokeyOmniBlockchain.GetBaseCoinAddressInfo(reqAddress);
    }

    /**
     * Getting transaction information
     * @param id Transaction Key (TrKey) or Transaction HASH
     */
    public async GetTransaction(id: string): Promise<Array<OmniTxInfo>> {
        return await this._prokeyOmniBlockchain.GetTransaction(id);
    }

    public async GetLatestTransactions(address: OmniAddressInfo , count = 10, offset = 0): Promise<Array<OmniTxInfo>>{
        return await this._prokeyOmniBlockchain.GetLatestTransactions(address, count, offset);
    }

    /**
     * Get Bitcoin transaction fee from server
     * @returns BitcoinFee
     */
    public async GetTxFee(): Promise<BitcoinFee> {
        var fees = await this._prokeyOmniBlockchain.GetTxFee();
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

        return fee;
    }

    /**
     * Broadcast a transaction to the network
     * @param txData Data to be broadcasted
     */
    public async BroadcastTransaction(txData: string): Promise<ProkeySendTransactionResponse> {
        return this._prokeyOmniBlockchain.BroadCastTransaction(txData);
    } 
    
}

