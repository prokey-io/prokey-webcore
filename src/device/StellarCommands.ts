import {ICoinCommands} from "./ICoinCommand";
import {RippleCoinInfoModel, StellarCoinInfoModel} from "../models/CoinInfoModel";
import {CoinBaseType, CoinInfo} from "../coins/CoinInfo";
import {Device} from "./Device";
import {
  MessageSignature,
  PublicKey,
  StellarAddress,
  StellarSignedTx,
  StellarSignTransactionRequest, StellarTxOpRequest,
  Success
} from "../models/Prokey";
import {GeneralErrors, GeneralResponse} from "../models/GeneralResponse";
import * as PathUtil from "../utils/pathUtils";
import * as ProkeyResponses from "../models/Prokey";
import {MyConsole} from "../utils/console";
import {StrKey} from "stellar-base";
import * as Utility from "../utils/utils";
import { ByteArrayToHexString } from "../utils/utils"

export class StellarCommands implements ICoinCommands {
  private readonly _coinInfo: StellarCoinInfoModel;

  constructor(coinName: string) {
    this._coinInfo = CoinInfo.Get<RippleCoinInfoModel>(coinName, CoinBaseType.Stellar);
  }

  /**
   * Get stellar account address based on given path
   * @param device Prokey device instance
   * @param path BIP path
   * @param showOnProkey true means show the address on device display
   * @returns StellarAddress stellar unique address
   */
  public async GetAddress(device: Device, path: Array<number> | string, showOnProkey: boolean = true): Promise<StellarAddress> {
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

    return await device.SendMessage<ProkeyResponses.StellarAddress>('StellarGetAddress', param, 'StellarAddress');
  }

  /**
   * Get a list of account addresses based on given paths
   * @param device Prokey device instance
   * @param paths List of BIP paths
   * @constructor
   */
  public async GetAddresses(device: Device, paths: Array<Array<number> | string>): Promise<Array<StellarAddress>> {
    let stellarAddresses: Array<StellarAddress> = new Array<StellarAddress>();
    for (const path of paths) {
      stellarAddresses.push(await this.GetAddress(device, path, false));
    }
    return stellarAddresses;
  }

  /**
   * Get Coin Info
   */
  public GetCoinInfo(): StellarCoinInfoModel {
    return this._coinInfo;
  }

  /**
   * Get Public key
   * @param device The prokey device
   * @param path BIP path
   * @param showOnProkey true means show the public key on prokey display
   */
  public async GetPublicKey(device: Device, path: Array<number> | string, showOnProkey: boolean = true): Promise<PublicKey> {
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
      coin_name: coinName || 'Stellar',
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
      coin_name: coinName || 'Stellar',
    }, 'Success');
  }

  /**
   * sign transaction
   * @param device
   * @param transactionForSign a model that containg a transaction model for device and sdk for create signed transaction
   * @constructor
   */
  public async SignTransaction(device: Device, transactionForSign: StellarSignTransactionRequest): Promise<string> {
    var OnFailure = (reason: any) => {
      device.RemoveOnFailureCallBack(OnFailure);

      throw new Error(`Signing transaction failed: ${reason.message}`);
    };

    MyConsole.Info("StellarSignTx", transactionForSign);

    if (!transactionForSign) {
      let e: GeneralResponse = {
        success: false,
        errorCode: GeneralErrors.INVALID_PARAM,
        errorMessage: "StellarCommands::SignTransaction->parameter transaction cannot be null",
      }

      throw e;
    }

    let firstOperationRequest = await device.SendMessage<StellarTxOpRequest>('StellarSignTx', transactionForSign.signTxMessage, 'StellarTxOpRequest');
    MyConsole.Info("operation request", firstOperationRequest);

    for (let i=0; i < transactionForSign.operations.length - 1; i++) {
      let operation = transactionForSign.operations[i];
      let operationRequest = await device.SendMessage<StellarTxOpRequest>(operation.type, operation, 'StellarTxOpRequest');
      MyConsole.Info("operation request", operationRequest);
    }

    let operation = transactionForSign.operations[transactionForSign.operations.length - 1];
    let signResponse = await device.SendMessage<StellarSignedTx>(operation.type, operation, 'StellarSignedTx');
    return await StellarCommands.prepareTransactionForBroadcast(transactionForSign, signResponse);
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

  /**
   * prepare signed transaction for sending over network
   * @param transactionForSign stellar transaction model
   * @param signResponse device sign response
   * @private
   */
  private static async prepareTransactionForBroadcast(transactionForSign: StellarSignTransactionRequest, signResponse: StellarSignedTx) {
    let transactionModel = transactionForSign.transactionModel;
    
    let stringSignature = ByteArrayToHexString(signResponse.signature);
    let decodedPublicKey = StrKey.encodeEd25519PublicKey(Buffer.from(signResponse.public_key));
    transactionModel.addSignature(
      decodedPublicKey,
      Buffer.from(stringSignature, 'hex').toString('base64')
    );
    return transactionModel.toEnvelope().toXDR().toString("base64");
  }
}
