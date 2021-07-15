import { httpclient } from "typescript-http-client";
import Request = httpclient.Request

export abstract class ProkeyBaseBlockChain {
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

    protected async PostToServer<T>(toServer: string, body: any): Promise<T> {
        const client = httpclient.newHttpClient();

        const request = new Request("https://blocks.prokey.org/" + toServer, {body: body, method: 'POST'});

        return JSON.parse(await client.execute<string>(request));
    }
}