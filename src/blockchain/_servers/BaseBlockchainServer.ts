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

import { Request, newHttpClient } from 'typescript-http-client';

export abstract class BaseBlockchainServer {
    /**
     * Get account info from blockchain node
     * @param publicKeyOrAddress Public key(XPUB, YPUB or ZPUB) or address(account base wallets)
     */
    //public abstract GetAccount(publicKeyOrAddress: string) : Promise<BitcoinAccountInfo | EthereumAccountInfo>;

    /**
     * This is a private helper function to GET data from server
     * @param url URL + data
     * @param changeJson a callback for adjust json before casting
     */
    protected static async GetFromServer<T>(url: string, changeJson?: (json: string) => string) {
        const client = newHttpClient();

        const request = new Request(url, { method: 'GET' });

        return JSON.parse(await client.execute<string>(request)) as T;
    }

    /**
     * This is a private helper function to POST data to server
     * @param url URL
     * @param body Request Body
     * @returns Response data from server
     */
    protected static async PostToServer<T>(url: string, body: any): Promise<T> {
        const client = newHttpClient();

        const request = new Request(url, { body: body, method: 'POST' });

        return JSON.parse(await client.execute<string>(request)) as T;
    }

    /**
     * This is a private helper function to call a Json RPC method
     * @param url Server URL
     * @param method The method name to be called
     * @param params Params to be passed to method
     * @returns Call response
     */
    protected static async JsonRpcV2Request(url: string, method: string, params: any): Promise<any> {
        const client = newHttpClient();
        const request = new Request(
            url, // server URL
            {
                method: 'POST',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: method,
                    params: [params],
                    id: 1,
                }),
            }
        );

        return JSON.parse(await client.execute<any>(request));
    }
}
