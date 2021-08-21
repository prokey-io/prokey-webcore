import { httpclient } from "typescript-http-client";
import Request = httpclient.Request
import {RequestAddressInfo} from "../../../../models/GenericWalletModel";

export abstract class ProkeyBaseBlockChain {

    // These functions must be implemented in child classes
    public abstract GetAddressInfo(reqAddresses: Array<RequestAddressInfo> | RequestAddressInfo);
    public abstract GetTransactions(hash: string);
    public abstract GetLatestTransactions(trs: Array<number>, count : number, offset: number);
    public abstract BroadCastTransaction(data: string);

    /**
     * This is a private helper function to GET data from server
     * @param toServer URL + data
     * @param changeJson a callback for adjust json before casting
     */
    protected async GetFromServer<T>(toServer: string, changeJson?: (json: string) => string) {

        const client = httpclient.newHttpClient();

        const request = new Request('https://blocks.prokey.org/' + toServer, { method: 'GET' });

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
        const client = httpclient.newHttpClient();

        const request = new Request("https://blocks.prokey.org/" + toServer, {body: body, method: 'POST'});

        return JSON.parse(await client.execute<string>(request));
    }
}