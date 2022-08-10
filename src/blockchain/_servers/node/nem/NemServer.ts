import {BaseBlockchainServer} from "../../BaseBlockchainServer";
import {RequestAddressInfo} from "../../../../models/GenericWalletModel";
import {BlockchainServerModel} from "../../../BlockchainProviders";
import {
  NemAccountInfo,
  NemAccountTransactionResponse,
  NemSubmitTransaction,
  NemTransactionResponse,
  SubmitTransactionResponse
} from "./NemModels";

export class NemServer extends BaseBlockchainServer {

  /**
   * broadcast transaction over network
   * @param server
   * @param data nem signed transaction including transaction and signature
   * @returns object response of transaction
   */
  public static async BroadCastTransaction(server: BlockchainServerModel, data: NemSubmitTransaction): Promise<SubmitTransactionResponse> {
    try {
      return await this.PostToServer<SubmitTransactionResponse>(`${server.url}/transaction/announce`, data);
    } catch (error) {
      throw new Error("error in submit transaction")
    }
  }

  /**
   * get account information from network
   * @param server
   * @param reqAddress address
   * @returns NemAccountInfo account info
   */
  public static async GetAddressInfo(server: BlockchainServerModel, reqAddress: RequestAddressInfo): Promise<NemAccountInfo | null> {
    try {
      return await this.GetFromServer<any>(`${server.url}/account/get?address=` + reqAddress.address);
    } catch (error) {
      return null;
    }
  }

  /**
   * get account transaction list from network
   * @param server
   * @param accountAddress address of account
   * @param previousPageHash used for pagination when you want next page
   * @returns NemTransactionResponse list of transactions
   */
  public static async GetAccountTransactions(server: BlockchainServerModel, accountAddress: string, previousPageHash?: string): Promise<Array<NemTransactionResponse> | null> {
    let queryUrl = `${server.url}/account/transfers/all?address=${accountAddress}/10`;
    if (previousPageHash) {
      queryUrl += `&hash=${previousPageHash}`;
    }
    let serverResponse = await this.GetFromServer<NemAccountTransactionResponse>(queryUrl);
    if (serverResponse != null && serverResponse.data != null)
    {
      return serverResponse.data;
    }
    return null;
  }
}
