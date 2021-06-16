import { httpclient } from "typescript-http-client";
import Request = httpclient.Request

export class ProkeyBaseBlockChain {
    /** 
     * This is a private helper function to GET data from server
     * @param toServer URL + data
     */
    protected async GetFromServer<T>(toServer: string) {

        const client = httpclient.newHttpClient();

        const request = new Request('https://blocks.prokey.org/' + toServer, { method: 'GET' });

        return JSON.parse(await client.execute<string>(request));
    }

}