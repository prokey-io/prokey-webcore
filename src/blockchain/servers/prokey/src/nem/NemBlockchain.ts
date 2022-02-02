import {ProkeyBaseBlockChain} from "../ProkeyBaseBlockChain";
import {RequestAddressInfo} from "../../../../../models/GenericWalletModel";
import {
  NemAccountInfo,
  NemAccountTransactionResponse,
  NemSubmitTransaction,
  NemTransactionResponse,
  SubmitTransactionResponse
} from "./NemModels";

export class NemBlockchain extends ProkeyBaseBlockChain {
  _coinName: string;

  constructor(coinName: string = "Nem")
  {
    super();
    this._coinName = coinName;
  }

  /**
   * broadcast transaction over network
   * @param data nem signed transaction including transaction and signature
   * @returns object response of transaction
   */
  public async BroadCastTransaction(data: NemSubmitTransaction): Promise<SubmitTransactionResponse> {
    try {
      return await this.PostToServer<any>(`Transaction/advanced-send/${this._coinName}/`, data);
    } catch (error) {
      throw new Error("error in submit transaction")
    }
  }

  /**
   * get account information from network
   * @param reqAddress address
   * @returns NemAccountInfo account info
   */
  public async GetAddressInfo(reqAddress: RequestAddressInfo): Promise<NemAccountInfo | null> {
    try {
      return await this.GetFromServer<NemAccountInfo>(`address/${this._coinName}/${reqAddress.address}`);
    } catch (error) {
      return null;
    }
  }

  /**
   * get account transaction list from network
   * @param accountAddress address of account
   * @param previousPageHash used for pagination when you want next page
   * @returns NemTransactionResponse list of transactions
   */
  public async GetAccountTransactions(accountAddress: string, previousPageHash?: string) : Promise<Array<NemTransactionResponse> | null> {
    let queryUrl = `address/transactions/${this._coinName}/${accountAddress}/10`;
    let serverResponse = await this.GetFromServer<NemAccountTransactionResponse>(queryUrl);
    if (serverResponse != null && serverResponse.data != null)
    {
      return serverResponse.data;
    }
    return null;
  }

  public async GetLatestTransactions(trs: Array<number>, count: number, offset: number) {
  }

  public async GetTransactions(hash: string) {
  }
}
