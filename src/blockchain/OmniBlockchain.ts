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
        
        fee.economy = fees.ecoFees[5].feerate * 100000;
        fee.normal = fees.fees[3].feerate * 100000;
        fee.high = fees.fees[1].feerate * 100000;

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

