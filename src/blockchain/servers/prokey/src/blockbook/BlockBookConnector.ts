import {newHttpClient, Request} from "typescript-http-client";
import {SendTransactionModel} from "./models/responses/SendTransactionModel";
import {FeeModel} from "./models/responses/bitcoin/FeeModel";

export class BlockBookConnector {
  private readonly _url;
  constructor(url: string) {
    this._url = url;
  }

  public async GetAddress<T>(address: string): Promise<T> {
    return this.GetFromServer<T>(`v2/address/${address}`)
  }

  public async GetTransaction<T>(transactionHash: string): Promise<T> {
    return this.GetFromServer<T>(`v2/tx/${transactionHash}`)
  }

  public async GetTransactionDetail<T>(transactionHash: string): Promise<T> {
    return this.GetFromServer<T>(`v2/tx-specific/${transactionHash}`)
  }

  public async BroadcastTransaction(transactionHexData: string): Promise<SendTransactionModel> {
    return this.GetFromServer<SendTransactionModel>(`v2/sendtx/${transactionHexData}`)
  }

  public async GetBitcoinBaseFee(targetBlocks: number): Promise<FeeModel> {
    return this.GetFromServer<FeeModel>(`v1/estimatefee/${targetBlocks}`)
  }

  /**
   * This is a private helper function to GET data from server
   * @param toServer URL + data
   * @param changeJson a callback for adjust json before casting
   */
  private async GetFromServer<T>(toServer: string, changeJson?: (json: string) => string) {

    const client = newHttpClient();

    const request = new Request(this._url + toServer, {method: 'GET'});

    let json = await client.execute<T>(request);

    // if (changeJson) {
    //   json = changeJson(json);
    // }

    return json;
  }

  /**
   * This is a private helper function to POST data to server
   * @param toServer URL
   * @param body Request Body
   * @returns Response data from server
   */
  private async PostToServer<T>(toServer: string, body: any): Promise<T> {
    const client = newHttpClient();

    const request = new Request(this._url + toServer, {body: body, method: 'POST'});

    return JSON.parse(await client.execute<string>(request));
  }
}
