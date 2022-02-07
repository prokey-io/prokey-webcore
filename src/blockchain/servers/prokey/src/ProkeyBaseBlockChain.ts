import { Request,
         newHttpClient } from 'typescript-http-client';
import {RequestAddressInfo} from "../../../../models/GenericWalletModel";

export abstract class ProkeyBaseBlockChain {
    _baseUrl = 'https://blocks.prokey.org/';

    // These functions must be implemented in child classes
    public abstract GetAddressInfo(reqAddresses: Array<RequestAddressInfo> | RequestAddressInfo);
    public abstract GetTransactions(hash: string);
    public abstract GetLatestTransactions(trs: Array<any>, count : number, offset: number);
    public abstract BroadCastTransaction(data: any);

    constructor(baseUrl: string = 'https://blocks.prokey.org/') {
      this._baseUrl = baseUrl;
    }
    /**
     * This is a private helper function to GET data from server
     * @param toServer URL + data
     * @param changeJson a callback for adjust json before casting
     */
    protected async GetFromServer<T>(toServer: string, changeJson?: (json: string) => string) {
        const client = newHttpClient();

        const request = new Request(this._baseUrl + toServer, {method: 'GET'});

        let json = await client.execute<string>(request);

        return this.handleJsonResponse<T>(changeJson, json);
      }

    /**
     * This is a private helper function to POST data to server
     * @param toServer URL
     * @param body Request Body
     * @returns Response data from server
     */
    protected async PostToServer<T>(toServer: string, body: any, changeJson?: (json: string) => string): Promise<T> {
        const client = newHttpClient();

        const request = new Request(this._baseUrl + toServer, {body: body, method: 'POST'});

        let json = await client.execute<string>(request);
        return this.handleJsonResponse<T>(changeJson, json);
    }

    private handleJsonResponse<T>(changeJson: ((json: string) => string) | undefined, json: string) {
        if (changeJson) {
          json = changeJson(json);
        }
        return JSON.parse(json) as T;
    }
}
