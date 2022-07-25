import {BlockchainProviders, BlockchainServerModel} from "./BlockchainProviders";
import {BlockchainBase} from "./BlockchainBase";
import {RequestAddressInfo} from "../models/GenericWalletModel";
import {BaseCoinInfoModel} from "../models/CoinInfoModel";
import {RippleProkeyServer} from "./_servers/prokey/ripple/RippleProkeyServer";
import {RippleAccountInfo, RippleFee, RippleTransactionDataInfo} from "./_servers/prokey/ripple/ProkeyRippleModel";
import {MyConsole} from "../utils/console";
import {AddressModel} from "../models/Prokey";

type ProcessServersCallBack<T> = (server: BlockchainServerModel) => Promise<T>;
type ProcessServersError = (error: any) => void;

export class RippleBlockchain extends BlockchainBase {
  constructor(coinInfo: BaseCoinInfoModel) {
    const servers: Array<BlockchainServerModel> = BlockchainProviders.Get(coinInfo);
    super(servers);
    console.log(servers);
    this._ensureThereIsAServer();
  }

  public async GetAddressInfo(reqAdd: AddressModel): Promise<RippleAccountInfo> {
    return this.foreachServer<RippleAccountInfo>(async server => {
      console.log(server);
      const rippleAccountInfo: RippleAccountInfo = await RippleProkeyServer.GetAddressInfo(server, reqAdd.address);
      return rippleAccountInfo;
    }, (error) => {
      MyConsole.Exception("RippleBlockchain::GetAddressInfo->", error);
    });
    // for (const server of this._servers) {
    //   if (server.apiType === 'prokey') {
    //     try {
    //       const rippleAccountInfo: RippleAccountInfo = await RippleProkeyServer.GetAddressInfo(server, reqAdd.address);
    //       rippleAccountInfo.addressModel = reqAdd.addressModel;
    //       return rippleAccountInfo;
    //     } catch (e) {
    //       MyConsole.Exception("RippleBlockchain::GetAddressInfo->",e);
    //     }
    //   }
    // }
  }

  public async BroadCastTransaction(transaction: string) {
    return this.foreachServer<RippleAccountInfo>(async server => {
      const rippleAccountInfo: RippleAccountInfo = await RippleProkeyServer.BroadCastTransaction(server, transaction);
      return rippleAccountInfo;
    }, (error) => {
      MyConsole.Exception("RippleBlockchain::BroadCastTransaction->", error);
    });
  }

  async GetAccountTransactions(account: string, limit: number = 10): Promise<Array<RippleTransactionDataInfo>> {
      return this.foreachServer<Array<RippleTransactionDataInfo>>(async server => {
        return await RippleProkeyServer.GetAccountTransactions(server, account, limit);
      }, (error) => {
        MyConsole.Exception("RippleBlockchain::GetAccountTransactions->", error);
      });
  }

  async GetFee(): Promise<RippleFee> {
      return this.foreachServer<RippleFee>(async server => {
        let rippleFee = await RippleProkeyServer.GetCurrentFee(server);
        console.log(rippleFee);
        return rippleFee;
      }, (error) => {
        MyConsole.Exception("RippleBlockchain::GetFee->", error);
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
