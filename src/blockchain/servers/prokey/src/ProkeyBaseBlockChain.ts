import { Request,
         newHttpClient } from 'typescript-http-client';
import {RequestAddressInfo} from "../../../../models/GenericWalletModel";

export abstract class ProkeyBaseBlockChain {
    _url = 'https://blocks.prokey.org/';

    constructor(url?: string) {
        if (url) {
            this._url = url;
        }
    }

// These functions must be implemented in child classes
    public abstract GetAddressInfo(reqAddresses: Array<RequestAddressInfo> | RequestAddressInfo);
    public abstract GetTransactions(hash: string);
    public abstract GetLatestTransactions(trs: Array<any>, count : number, offset: number);
    public abstract BroadCastTransaction(data: any);

    /**
     * This is a private helper function to GET data from server
     * @param toServer URL + data
     * @param changeJson a callback for adjust json before casting
     */
    protected async GetFromServer<T>(toServer: string, changeJson?: (json: string) => string) {

        const client = newHttpClient();

        const request = new Request(this._url + toServer, { method: 'GET' });

        let json = await client.execute<string>(request);

        if (changeJson) {
            json = changeJson(json);
        }

        return JSON.parse(json) as T;
    }

    /**
     * This is a private helper function to POST data to server
     * @param toServer URL
     * @param body Request Body
     * @returns Response data from server
     */
    protected async PostToServer<T>(toServer: string, body: any): Promise<T> {
        const client = newHttpClient();

        const request = new Request(this._url + toServer, {body: body, method: 'POST'});

        return JSON.parse(await client.execute<string>(request));
    }
}
