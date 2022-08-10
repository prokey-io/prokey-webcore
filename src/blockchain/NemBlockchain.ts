import {BlockchainBase} from "./BlockchainBase";
import {RequestAddressInfo} from "../models/GenericWalletModel";
import {BaseCoinInfoModel} from "../models/CoinInfoModel";
import {BlockchainProviders, BlockchainServerModel} from "./BlockchainProviders";
import {MyConsole} from "../utils/console";
import {NemServer} from "./_servers/node/nem/NemServer";
import {NemAccountInfo, NemTransactionResponse, SubmitTransactionResponse} from "./_servers/node/nem/NemModels";
import {NemSubmitTransaction} from "./servers/prokey/src/nem/NemModels";

type ProcessServersCallBack<T> = (server: BlockchainServerModel) => Promise<T>;
type ProcessServersError = (error: any) => void;

export class NemBlockchain extends BlockchainBase {
  constructor(coinInfo: BaseCoinInfoModel) {
    const servers: Array<BlockchainServerModel> = BlockchainProviders.Get(coinInfo);
    super(servers);
    this._ensureThereIsAServer();
  }

  public async GetAddressInfo(reqAdd: RequestAddressInfo) {
    return this.foreachServer<NemAccountInfo | null>(async server => {
      return NemServer.GetAddressInfo(server, reqAdd);
    }, (error) => {
      MyConsole.Exception("NemBlockchain::GetAddressInfo->", error);
    });
  }

  public async BroadCastTransaction(data: NemSubmitTransaction) {
    return this.foreachServer<SubmitTransactionResponse>(async server => {
      return NemServer.BroadCastTransaction(server, data);
    }, (error) => {
      MyConsole.Exception("NemBlockchain::BroadCastTransaction->", error);
    });
  }

  async GetAccountTransactions(accountAddress: string, previousPageHash?: string): Promise<Array<NemTransactionResponse> | null> {
    return this.foreachServer<Array<NemTransactionResponse> | null>(async server => {
      return await NemServer.GetAccountTransactions(server, accountAddress, previousPageHash);
    }, (error) => {
      MyConsole.Exception("NemBlockchain::GetAccountTransactions->", error);
    });
  }

  private async foreachServer<T>(callback: ProcessServersCallBack<T>, errorCallback: ProcessServersError): Promise<T> {
    for (const server of this._servers) {
      try {
        return await callback(server);
      } catch (e: any) {
        errorCallback(e);
      }
    }
    throw new Error('there is no provider that respond to this request');
  }

  private _ensureThereIsAServer() {
    if(this._servers == undefined || this._servers.length == 0) {
      throw new Error("RippleBlockchain::_ensureThereIsAServer->No server")
    }
  }
}
