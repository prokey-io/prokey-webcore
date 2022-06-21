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

import { BlockchainServerModel } from "../../BlockchainProviders";
import { BaseBlockchainServer } from "../BaseBlockchainServer";
import { BitcoinAccountInfoModel, BitcoinAddressInfoModel, BitcoinTransactionDetailInfoModel, BitcoinTransactionInfoModel, BitcoinUtxoModel } from "./BlockbookBitcoinModel";
import { BlockbookRequestDetails } from "./BlockbookRequestModels";
import { BlockbookFeeModel, BlockbookTransactionResult } from "./BlockbookCommonModel"

export class BlockbookServer extends BaseBlockchainServer {
    
    private _lastFeeFetchTime: Date = new Date();

    constructor() {
        super();

        // Initial time to yesterday
        this._lastFeeFetchTime.setDate(this._lastFeeFetchTime.getDate() - 1);
    }

    /**
     * Get bitcoin account using public key
     * @param server Server Model
     * @param publicKey publicKey in XPUB/YPUB/ZPUB format
     * @param details level of details
     * @returns 
     */
    public static async GetAccount(server: BlockchainServerModel, publicKey: string, details?: BlockbookRequestDetails): Promise<BitcoinAccountInfoModel> {
        const url = `${server.url}/xpub/${publicKey}` + this._getReqParams(details);
        
        return await this.GetFromServer<BitcoinAccountInfoModel>(url);
    }

    /**
     * Get information about an address
     * @param server Server Model
     * @param address address
     * @param details level of details
     */
    public static async GetAddressInfo<T>(server: BlockchainServerModel, address: string, details?: BlockbookRequestDetails): Promise<T> {
        const url = `${server.url}/address/${address}` + this._getReqParams(details);

        return await this.GetFromServer<T>(url);
    }

    /**
     * Get list of unspent transactions
     * @param server Server model
     * @param addressOrPublicKey Address or publickey
     * @returns list of Utxo
     */
    public static async GetUtxo(server: BlockchainServerModel, addressOrPublicKey: string): Promise<BitcoinUtxoModel[]> {
        const url = `${server.url}/utxo/${addressOrPublicKey}`;

        return await this.GetFromServer<BitcoinUtxoModel[]>(url);
    }

    /**
     * Get transaction info from server
     * @param server Server model
     * @param txid Transaction id
     * @returns Transaction info
     */
    public static async GetTransaction(server: BlockchainServerModel, txid: string): Promise<BitcoinTransactionInfoModel> {
        const url = `${server.url}/tx/${txid}`;

        return await this.GetFromServer<BitcoinTransactionInfoModel>(url);
    }

    /**
     * 
     * @param server Server model
     * @param txid Transaction id
     * @returns transaction data in the exact format as returned by backend
     */
    public static async GetRawTransaction(server: BlockchainServerModel, txid: string): Promise<BitcoinTransactionDetailInfoModel> {
        const url = `${server.url}/tx-specific/${txid}`;

        return await this.GetFromServer<BitcoinTransactionDetailInfoModel>(url);
    }

    /**
     * Send new transaction to network
     * @param server Server model
     * @param transaction Signed transaction
     * @returns Broadcast result
     */
    public static async BroadcastTransaction(server: BlockchainServerModel, transaction: string): Promise<BlockbookTransactionResult> {
        const url = `${server.url}/sendtx/${transaction}`;

        return await this.GetFromServer<BlockbookTransactionResult>(url);
    }

    /**
     * Estimate transaction fee
     * @param server Server model
     * @param numberOfBlocks desire blocknumber
     * @returns Fee model (per BTC)
     */
    public static async GetEstimateFee(server: BlockchainServerModel, numberOfBlocks: number): Promise<BlockbookFeeModel> {
        const url = `${server.url}/estimatefee/${numberOfBlocks}`;

        return await this.GetFromServer<BlockbookFeeModel>(url);
    }

    //******************************
    // PRIVATE FUNCTIONS
    //******************************
    /**
     * serialize parameters
     * @param details 
     * @returns 
     */
    private static _getReqParams(details?: BlockbookRequestDetails): string {
        if(details == null)
            return '';
        
        let p = `?page=${details.page}&pagesize=${details.pageSize}&details=${details.details}&tokens=${details.tokens}`;

        if(details.from)
            p += `&from=${details.from}`;

        if(details.to)
            p += `&to=${details.to}`;

        return p;
    }
}