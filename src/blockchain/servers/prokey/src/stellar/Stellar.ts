import {ProkeyBaseBlockChain} from "../ProkeyBaseBlockChain";
import {RequestAddressInfo} from "../../../../../models/GenericWalletModel";
import {
  StellarAccountInfo,
  StellarFee,
  StellarTransactionOperationResponse,
  StellarTransactionResponse
} from "./StellarModels";
import {MyConsole} from "../../../../../utils/console";

export class StellarBlockchain extends ProkeyBaseBlockChain {
  _coinName: string;

  constructor(coinName: string = "Xlm")
  {
    super();
    this._coinName = coinName;
    MyConsole.Info(this._coinName);
  }

  /**
   * broadcast transaction over network
   * @param data stellar signed transaction (base64 format)
   * @returns object response of transaction
   */
  public async BroadCastTransaction(data: string): Promise<any> {
    return await this.PostToServer<any>(`Transaction/advanced-send/${this._coinName}/`, {"SignedTransactionBlob": data});
  }

  /**
   * get account information from network
   * @param reqAddress address
   * @returns StellarAccountInfo account info
   */
  public async GetAddressInfo(reqAddress: RequestAddressInfo) : Promise<StellarAccountInfo | null> {
    try {
      return await this.GetFromServer<StellarAccountInfo>(`address/${this._coinName}/${reqAddress.address}`);
    } catch (error) {
      return null;
    }
  }

  /**
   * get account transaction list from network
   * @param accountAddress address of account
   * @param limit number of transactions
   * @param cursor used for pagination when you want next page
   * @returns StellarAccountInfo list of transactions
   */
  public async GetAccountTransactions(accountAddress: string, limit: number = 10, cursor?: string): Promise<StellarTransactionResponse | null> {
    let serverResponse = await this.GetFromServer<any>(`address/transactions/${this._coinName}/${accountAddress}/${limit}`);
    if (serverResponse != null && serverResponse.transactions != null)
    {
      return serverResponse;
    }
    return null;
  }

  /**
   * get operations of a specific transaction
   * @param transactionId transaction id
   * @returns StellarTransactionOperationResponse list of operations
   */
  public async GetTransactionOperations(transactionId: string): Promise<StellarTransactionOperationResponse | null> {
    let queryUrl = `transaction/${this._coinName}/${transactionId}`;
    let serverResponse = await this.GetFromServer<any>(queryUrl);
    if (serverResponse != null && serverResponse.operations != null)
    {
      return serverResponse;
    }
    return null;
  }

  /**
   * get network fee detail
   * @returns StellarFee
   */
  public async GetCurrentFee(): Promise<StellarFee> {
    return await this.GetFromServer<StellarFee>(`transaction/fee/${this._coinName}`);
  }

  GetLatestTransactions(trs: Array<number>, count: number, offset: number) {
  }

  GetTransactions(hash: string) {
  }
}
