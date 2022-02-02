import {BaseWallet} from "./BaseWallet";
import {NemBlockchain} from "../blockchain/servers/prokey/src/nem/NemBlockchain";
import {
  NemAccount,
  NemAccountInfo,
  NemSubmitTransaction,
  NemTransactionResponse, SubmitTransactionResponse
} from "../blockchain/servers/prokey/src/nem/NemModels";
import {CoinBaseType} from "../coins/CoinInfo";
import {Device} from "../device/Device";
import {NemCoinInfoModel} from "../models/CoinInfoModel";
import {AddressModel, NEMAddress, NEMSignedTx, NEMSignTxMessage} from "../models/Prokey";
import {createTx} from "../helpers/nem/NemSignTxHelper";
import {NEMTransferTransaction} from "../helpers/nem/NemWalletModels";
import {ByteArrayToHexString} from "../utils/utils";
import * as PathUtil from "../utils/pathUtils";

var WAValidator = require('multicoin-address-validator');

export class NemWallet extends BaseWallet {
  _block_chain : NemBlockchain;
  _accounts: Array<NemAccount>;
  private readonly NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
  private readonly NEM_DEADLINE_IN_MINUTE = 5;

  constructor(device: Device, coinName: string) {
    super(device, coinName, CoinBaseType.NEM);
    this._block_chain = new NemBlockchain(this.GetCoinInfo().shortcut);
    this._accounts = [];
  }

  IsAddressValid(address: string): boolean {
    return WAValidator.validate(address, "xem");
  }

  /**
   * discover network for collecting this device accounts information
   * @param accountFindCallBack
   * @returns Array<NemAccount> an array of accounts information
   */
  public async StartDiscovery(accountFindCallBack?: (accountInfo: NemAccount) => void): Promise<Array<NemAccount>>
  {
    return new Promise<Array<NemAccount>>(async (resolve, reject) => {
      let accountNumber = 0;
      this._accounts = new Array<NemAccount>();
      do
      {
        let accountInfo = await this.GetAccountInfo(accountNumber);
        if (accountInfo == null) {
          return resolve(this._accounts);
        }
        if (accountInfo.account.balance == 0)
        {
          return resolve(this._accounts);
        }
        this._accounts.push(accountInfo.account);
        if (accountFindCallBack) {
          accountFindCallBack(accountInfo.account);
        }
        accountNumber++;
      } while(true);
    });
  }

  /**
   * get account info base on account number
   * @param accountNumber account number in device
   * @returns NemAccountInfo account information
   */
  private async GetAccountInfo(accountNumber: number): Promise<NemAccountInfo | null> {
    let address = await this.GetAccountAddress(accountNumber);

    return await this._block_chain.GetAddressInfo({address: address.address});
  }

  public async GetAccountTransactions(account: string): Promise<Array<NemTransactionResponse>> {
    let nemTransactionsResponse = await this._block_chain.GetAccountTransactions(account);
    if (nemTransactionsResponse) {
      return nemTransactionsResponse;
    }
    return [];
  }

  /**
   * get account address base on account number
   * @param accountNumber account number in device
   * @returns string account address
   */
  private async GetAccountAddress(accountNumber: number) {
    let path = PathUtil.GetBipPath(
      CoinBaseType.NEM,
      accountNumber,
      super.GetCoinInfo()
    )

    return await this.GetAddress<NEMAddress>(path.path, false);
  }

  /**
   * prepare payment transaction request object for sign in device and broadcast over network
   * @param toAccount receiver account
   * @param amount xem amount for sending
   * @param accountNumber user account number in device
   * @param selectedFee user selected fee
   * @returns NEMSignTxMessage
   */
  public async GenerateTransaction(toAccount: string, amount: number, accountNumber: number, selectedFee: string): Promise<NEMSignTxMessage> {
    let path = PathUtil.GetBipPath(
      CoinBaseType.NEM,
      accountNumber,
      super.GetCoinInfo()
    ).path;
    const senderAccountInfo: NemAccountInfo | null = await this.GetAccountInfo(accountNumber);
    const publicKey = await this.GetCommands().GetPublicKey(this.GetDevice(), path, false);
    if (!senderAccountInfo) {
      throw new Error('signer account does not exist');
    }
    if (!publicKey) {
      throw new Error('receiver account public key does not exist');
    }

    let transactionTimestamp = this.createNEMTimeStamp();
    let nemTransferModel: NEMTransferTransaction = {
      type: 0x0101,
      version: this.getVersion(1, this.getNemNetworkId()), // Network.getVersion(2, network) when we have mosaics
      timeStamp: transactionTimestamp,
      fee: +selectedFee,
      deadline: transactionTimestamp + (this.NEM_DEADLINE_IN_MINUTE * 60),
      recipient: toAccount,
      amount: amount,
    }
    return createTx(nemTransferModel, path);
  }

  /**
   * broadcast transaction over network
   * @param signedTransaction device signed transaction response
   * @returns SubmitTransactionResponse
   */
  public async SendTransaction(signedTransaction: NEMSignedTx): Promise<SubmitTransactionResponse> {
    // convert byte to array
    let transactionSubmitModel: NemSubmitTransaction = {
      data: ByteArrayToHexString(signedTransaction.data),
      signature: ByteArrayToHexString(signedTransaction.signature)
    }
    return await this._block_chain.BroadCastTransaction(transactionSubmitModel);
  }

  private getNemNetworkId() {
    return this.GetCoinInfo().test ? 0x98 : 0x68;
  }

  private createNEMTimeStamp(): number {
    return Math.floor((Date.now() / 1000) - (this.NEM_EPOCH / 1000));
  }

  getVersion(val, networkId) {
    if (networkId === 0x68) {
      return 0x68000000 | val;
    } else if (networkId === 0x98) {
      return 0x98000000 | val;
    }
    return 0x60000000 | val;
  }
}
