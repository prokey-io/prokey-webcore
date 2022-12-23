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

import { BaseBlockchainServer } from '../BaseBlockchainServer';
import { BlockchainServerModel } from '../../BlockchainProviders';
import {
    RippleAccountInfoResponse,
    RippleFeeResponse,
    RippleAccountTxResponse,
    RippleSubmitTransactionResponse,
} from './RippleRpcModel';

export class RippleServer extends BaseBlockchainServer {
    /**
     * Get information about an address
     * @param server Server Model
     * @param address address
     */
    public static async GetAddressInfo(server: BlockchainServerModel, address: string): Promise<RippleAccountInfoResponse> {
        const res = await this.JsonRpcV2Request(
            server.url, // Server URL
            'account_info', // method
            {
                // params
                account: address,
                strict: true,
                ledger_index: 'current',
                queue: false,
            }
        );

        if (res == null || res.result == null) {
            Promise.reject('Not a valid response from the server');
        }

        return res.result;
    }

    /**
     * Broadcasting the transaction
     * @param server Server Model
     * @param data Signed data to be broadcasted to network
     * @returns
     */
    public static async BroadCastTransaction(
        server: BlockchainServerModel,
        data: string
    ): Promise<RippleSubmitTransactionResponse> {
        const res = await this.JsonRpcV2Request(
            server.url, // Server URL
            'submit', // method
            {
                // params
                tx_blob: data,
            }
        );

        return res.result;
    }

    /**
     * Getting list of transaction info
     * @param server Server Model
     * @param account Account address
     * @param limit Number of transactions
     * @returns List of ripple transaction data
     */
    public static async GetAccountTransactions(
        server: BlockchainServerModel,
        account: string,
        limit: number = 10
    ): Promise<RippleAccountTxResponse> {
        const res = await this.JsonRpcV2Request(
            server.url, // Server URL
            'account_tx', // method
            {
                // params
                account: account,
                binary: false,
                forward: false,
                ledger_index_max: -1,
                ledger_index_min: -1,
                limit: limit
            }
        );

        if (res == null || res.result == null) {
            Promise.reject('Not a valid response from the server');
        }

        return res.result;
    }

    /**
     * Getting current fee
     * @returns Ripple Fee
     */
    public static async GetCurrentFee(server: BlockchainServerModel): Promise<RippleFeeResponse> {
        const res = await this.JsonRpcV2Request(
            server.url, // Server URL
            'fee', // method
            {} // no param needed
        );

        if (res == null || res.result == null) {
            Promise.reject('Not a valid response from the server');
        }

        return res.result;
    }
}
