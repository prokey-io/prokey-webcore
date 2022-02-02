import {ICoinCommands} from "./ICoinCommand";
import {Device} from "./Device";
import {
  MessageSignature,
  NEMAddress,
  NEMGetAddress,
  NEMSignedTx,
  NEMSignTxMessage,
  PublicKey,
  Success
} from "../models/Prokey";
import {NemCoinInfoModel} from "../models/CoinInfoModel";
import {CoinBaseType, CoinInfo} from "../coins/CoinInfo";
import {GeneralErrors, GeneralResponse} from "../models/GeneralResponse";
import * as PathUtil from "../utils/pathUtils";
import * as ProkeyResponses from "../models/Prokey";
import * as Utility from "../utils/utils";
import {MyConsole} from "../utils/console";

export class NemCommands implements ICoinCommands {
  private readonly _coinInfo: NemCoinInfoModel;

  constructor(coinName: string) {
    this._coinInfo = CoinInfo.Get<NemCoinInfoModel>(coinName, CoinBaseType.NEM);
    if (this._coinInfo == null) {
      throw new Error(`Cannot load CoinInfo for ${coinName}`);
    }
  }

  /**
   * Get nem account address based on given path
   * @param device Prokey device instance
   * @param path BIP path
   * @param showOnProkey true means show the address on device display
   * @returns NEMAddress nem unique address
   */
  public async GetAddress(device: Device, path: Array<number> | string, showOnProkey: boolean = true): Promise<NEMAddress> {
    if (device == null || path == null) {
      return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
    }

    // convert path to array of num
    let address_n: Array<number> = this.GetAddressArray(path);

    let param : NEMGetAddress = {
      address_n: address_n,
      network: this.getNemNetworkId(),
      show_display: showOnProkey
    }

    return await device.SendMessage<ProkeyResponses.NEMAddress>('NEMGetAddress', param, 'NEMAddress');
  }

  /**
   * Get a list of account addresses based on given paths
   * @param device Prokey device instance
   * @param paths List of BIP paths
   * @returns Array<NEMAddress>
   */
  public async GetAddresses(device: Device, paths: Array<Array<number> | string>): Promise<Array<NEMAddress>> {
    let nemAddresses: Array<NEMAddress> = new Array<NEMAddress>();
    for (const path of paths) {
      nemAddresses.push(await this.GetAddress(device, path, false));
    }
    return nemAddresses;
  }

  /**
   * Get Coin Info
   */
  public GetCoinInfo(): NemCoinInfoModel {
    return this._coinInfo;
  }

  /**
   * Get Public key
   * @param device The prokey device
   * @param path BIP path
   * @param showOnProkey true means show the public key on prokey display
   */
  public async GetPublicKey(device: Device, path: Array<number> | string, showOnProkey?: boolean): Promise<PublicKey> {
    if (device == null || path == null) {
      return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
    }
    let address_n: Array<number>;
    try {
      address_n = this.GetAddressArray(path);
    }
    catch (e) {
      return Promise.reject({ success: false, errorCode: GeneralErrors.PATH_NOT_VALID });
    }
    let param = {
      address_n: address_n,
      show_display: showOnProkey,
    }

    return await device.SendMessage<ProkeyResponses.PublicKey>('GetPublicKey', param, 'PublicKey');
  }

  /**
   * Sign Message
   * @param device Prokey device instance
   * @param path array of BIP32/44 Path
   * @param message message to be signed
   * @param coinName coin name
   */
  public async SignMessage(device: Device, path: Array<number>, message: Uint8Array, coinName?: string): Promise<MessageSignature> {
    let scriptType = PathUtil.GetScriptType(path);

    let res = await device.SendMessage<ProkeyResponses.MessageSignature>('SignMessage', {
      address_n: path,
      message: message,
      coin_name: coinName || 'Nem',
      script_type: scriptType,
    }, 'MessageSignature');

    if (res.signature) {
      res.signature = Utility.ByteArrayToHexString(res.signature);
    }

    return res;
  }

  /**
   * Verify Message
   * @param device Prokey device instance
   * @param address address
   * @param message message
   * @param signature signature data
   * @param coinName coin name
   */
  public async VerifyMessage(device: Device, address: string, message: Uint8Array, signature: Uint8Array, coinName?: string): Promise<Success> {
    return await device.SendMessage<ProkeyResponses.Success>('VerifyMessage', {
      address: address,
      signature: signature,
      message: message,
      coin_name: coinName || 'Nem',
    }, 'Success');
  }

  /**
   * sign transaction
   * @param device
   * @param transaction nem device transaction message request
   * @returns NEMSignedTx a model containing transaction data and signature
   */
  public async SignTransaction(device: Device, transaction: NEMSignTxMessage): Promise<NEMSignedTx> {
    var OnFailure = (reason: any) => {
      device.RemoveOnFailureCallBack(OnFailure);

      throw new Error(`Signing transaction failed: ${reason.message}`);
    };

    MyConsole.Info("NEMSignTxMessage", transaction);

    if (!transaction) {
      let e: GeneralResponse = {
        success: false,
        errorCode: GeneralErrors.INVALID_PARAM,
        errorMessage: "NemCommands::SignTransaction->parameter transaction cannot be null",
      }

      throw e;
    }
    let transactionResponse = await device.SendMessage<NEMSignedTx>('NEMSignTx', transaction, 'NEMSignedTx');
    device.RemoveOnFailureCallBack(OnFailure);
    return transactionResponse;
  }

  private getNemNetworkId() {
    let networkId;
    if (this._coinInfo.test) {
      return 0x98;
    } else {
      return 0x68;
    }
  }

  /**
   * get byte array of path if its serialized
   * @param path
   * @returns Array<number> account BIP path
   */
  public GetAddressArray(path: Array<number> | string) : Array<number> {
    if (typeof path == "string") {
      return  PathUtil.getHDPath(path);
    } else {
      return  path;
    }
  }
}
