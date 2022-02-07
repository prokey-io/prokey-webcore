import {BaseWallet} from "./BaseWallet";
import {Device} from "../device/Device";
import {CoinBaseType} from "../coins/CoinInfo";
import {StellarCoinInfoModel} from "../models/CoinInfoModel";
import {
  AddressModel,
  StellarAddress, StellarOperationMessage, StellarPaymentOp,
  StellarSignTransactionRequest,
  StellarSignTxMessage
} from "../models/Prokey";
import {StellarBlockchain} from "../blockchain/servers/prokey/src/stellar/Stellar";
import {
  StellarAccountInfo,
  StellarFee, StellarTransactionOperationResponse,
  StellarTransactionResponse
} from "../blockchain/servers/prokey/src/stellar/StellarModels";
import {
  Account,
  Asset,
  Keypair,
  Memo, MemoType,
  Operation,
  TransactionBuilder, xdr
} from "stellar-base";
import * as PathUtil from "../utils/pathUtils";

const BigNumber = require('bignumber.js');

var WAValidator = require('multicoin-address-validator');

export class StellarWallet extends BaseWallet {
  private readonly STELLAR_BASE_RESERVE = 0.5;
  private readonly _networkPublicPassphrase = "Public Global Stellar Network ; September 2015";
  private readonly _networkTestPassphrase = "Test SDF Network ; September 2015";

  _block_chain: StellarBlockchain;
  _accounts: Array<StellarAccountInfo>;

  constructor(device: Device, coinName: string) {
    super(device, coinName, CoinBaseType.Stellar);
    this._block_chain = new StellarBlockchain(this.GetCoinInfo().shortcut);
    this._accounts = new Array<StellarAccountInfo>();
  }

  public IsAddressValid(address: string): boolean {
    return WAValidator.validate(address, "xlm");
  }

  /**
   * discover network for collecting this device accounts information
   * @param accountFindCallBack
   * @returns Array<StellarAccountInfo> an array of accounts information
   */
  public async StartDiscovery(accountFindCallBack?: (accountInfo: StellarAccountInfo) => void): Promise<Array<StellarAccountInfo>> {
    return new Promise<Array<StellarAccountInfo>>(async (resolve, reject) => {
      let accountNumber = 0;
      do {
        let account = await this.GetAccountInfo(accountNumber);
        if (account == null) {
          return resolve(this._accounts);
        }
        this._accounts.push(account);
        if (accountFindCallBack) {
          accountFindCallBack(account);
        }
        accountNumber++;
      } while (true);
    });
  }

  /**
   * get account info
   * @param accountNumber account number in device
   * @returns StellarAccountInfo account information
   */
  public async GetAccountInfo(accountNumber: number): Promise<StellarAccountInfo | null> {
    let path = this.GetCoinPath(accountNumber);
    let address = await this.GetAddress<StellarAddress>(path.path, false);
    return await this.GetAccountInfoByAddress(address.address);
  }

  public async GetAccountInfoByAddress(accountAddress: string): Promise<StellarAccountInfo | null> {
    return await this._block_chain.GetAddressInfo({address: accountAddress})
  }

  public async GetAccountTransactions(account: string, limit?: number, cursor?: string): Promise<StellarTransactionResponse | null> {
    return await this._block_chain.GetAccountTransactions(account, limit, cursor);
  }

  public async GetTransactionOperations(transactionId: string): Promise<StellarTransactionOperationResponse | null> {
    return await this._block_chain.GetTransactionOperations(transactionId);
  }

  public async GetCurrentFee(): Promise<StellarFee> {
    return await this._block_chain.GetCurrentFee();
  }

  /**
   * prepare payment transaction request object for sign in device and broadcast over network
   * @param toAccount receiver account
   * @param amount
   * @param accountNumber user account number in device
   * @param selectedFee user selected fee
   * @returns StellarSignTransactionRequest
   */
  public async GenerateTransaction(toAccount: string, amount: number, accountNumber: number, selectedFee: string, memoType: MemoType = "none", memoValue: string = ""): Promise<StellarSignTransactionRequest> {
    // TODO: add memo latter
    // Check balance
    let balance = this.GetAccountBalance(accountNumber);
    this.validateBalance(balance, accountNumber, amount, selectedFee);
    let path = this.GetCoinPath(accountNumber).path;
    const accountObject = this.GetAccount(accountNumber);
    // fetch account for valid sequence
    const updatedAccount = await this.GetAccountInfoByAddress(accountObject.account_id);

    if (!updatedAccount) {
      throw new Error("your account is not valid");
    }

    let account = new Account(accountObject.account_id, updatedAccount.sequence.toString());
    const stellarTransactionModel = new TransactionBuilder(account, {
      fee: selectedFee,
      networkPassphrase: this.getNetworkPassphrase()
    })
      .addOperation(
        // this operation funds the new account with XLM
        Operation.payment({
          destination: toAccount,
          asset: Asset.native(),
          amount: amount.toString()
        })
      )
      .addMemo(StellarWallet.getMemo(memoType, memoValue))
      .setTimeout(180) // wait 3 min for transaction
      .build();

    return this.transformTransaction(path, stellarTransactionModel);
  }

  /**
   * prepare create account transaction request object for sign in device and broadcast over network
   * @param toAccount requested account for creation
   * @param amount
   * @param accountNumber user account number in device
   * @param selectedFee user selected fee
   * @returns StellarSignTransactionRequest
   */
  public async GenerateCreateAccountTransaction(toAccount: string, amount: number, accountNumber: number, selectedFee: string, memoType: MemoType = "none", memoValue: string = ""): Promise<StellarSignTransactionRequest> {
    let balance = this.GetAccountBalance(accountNumber);
    let path = this.GetCoinPath(accountNumber).path;

    this.validateBalance(balance, accountNumber, amount, selectedFee);
    const accountObject = this.GetAccount(accountNumber);
    // fetch account for valid sequence
    const updatedAccount = await this.GetAccountInfoByAddress(accountObject.account_id);

    if (!updatedAccount) {
      throw new Error("your account is not valid");
    }
    let account = new Account(accountObject.account_id, updatedAccount.sequence.toString());
    const stellarTransactionModel = new TransactionBuilder(account, {
      fee: selectedFee,
      networkPassphrase: this.getNetworkPassphrase()
    })
      .addOperation(
        Operation.createAccount({
          destination: toAccount,
          startingBalance: amount.toString()
        })
      )
      .addMemo(StellarWallet.getMemo(memoType, memoValue))
      .setTimeout(180) // wait 3 min for transaction
      .build();
    return this.transformTransaction(path, stellarTransactionModel);
  }

  /**
   * transform stellar sdk transaction to prokey transaction object
   * @param path BIP path
   * @param transaction stellar sdk transaction
   */
  public transformTransaction(path: Array<number>, transaction): StellarSignTransactionRequest {
    const amounts = ['amount', 'sendMax', 'destAmount', 'startingBalance', 'limit'];
    const assets = ['asset', 'sendAsset', 'destAsset', 'selling', 'buying', 'line'];

    const operations = transaction.operations.map((o, i) => {
      const operation = {...o};

      if (operation.signer) {
        operation.signer = this.transformSigner(operation.signer);
      }

      if (operation.path) {
        operation.path = operation.path.map(this.transformAsset);
      }

      if (typeof operation.price === 'string') {
        const xdrOperation = transaction.tx.operations()[i];
        operation.price = {
          n: xdrOperation.body().value().price().n(),
          d: xdrOperation.body().value().price().d(),
        };
      }

      amounts.forEach(field => {
        if (typeof operation[field] === 'string') {
          operation[field] = this.transformAmount(operation[field]);
        }
      });

      assets.forEach(field => {
        if (operation[field]) {
          operation[field] = this.transformAsset(operation[field]);
        }
      });

      if (operation.type === 'allowTrust') {
        const allowTrustAsset = new Asset(operation.assetCode, operation.trustor);
        operation.asset = this.transformAsset(allowTrustAsset);
      }

      if (operation.type === 'manageData' && operation.value) {
        // stringify is not necessary, Buffer is also accepted
        operation.value = operation.value.toString('hex');
      }

      return this.transformType(operation);
    });

    let signTxMessage: StellarSignTxMessage = {
      address_n: path,
      source_account: transaction.source,
      fee: transaction.fee, // todo: if multi operations transaction implemented this value must changes(exm: fee * operationNumber)
      sequence_number: transaction.sequence,
      network_passphrase: transaction.networkPassphrase,
      num_operations: operations.length,
    };
    this.transformTimebounds(signTxMessage, transaction.timeBounds);
    this.transformMemo(signTxMessage, transaction.memo);

    return {
      signTxMessage: signTxMessage,
      operations: operations,
      transactionModel: transaction
    }
  }

  public async SendTransaction(tx: string): Promise<any> {
    return await this._block_chain.BroadCastTransaction(tx);
  }

  public GetAccountBalance(accountNumber: number): number {
    let account = this.GetAccount(accountNumber);
    let nativeBalance = account.balances.find(balance => balance.asset_type === "native");
    if (nativeBalance) {
      return +nativeBalance.balance;
    }
    return 0;
  }

  public GetAccountReserveBalance(accountNumber: number): number {
    let account = this.GetAccount(accountNumber);
    return (2 + account.subentry_count + account.num_sponsoring - account.num_sponsored) * this.STELLAR_BASE_RESERVE;
  }

  private static getMemo(memoType: MemoType, memoValue: string): Memo {
    if (memoValue == "") {
      return Memo.none();
    }
    switch (memoType) {
      case "hash":
        return Memo.hash(memoValue);
      case "id":
        return Memo.id(memoValue)
      case "none":
        return Memo.none();
      case "return":
        return Memo.return(memoValue);
      case "text":
        return Memo.text(memoValue);
    }
  }

  private validateBalance(balance: number, accountNumber: number, amount: number, selectedFee: string) {
    balance = balance - this.GetAccountReserveBalance(accountNumber) - amount - (+selectedFee);
    if (balance < 0)
      throw new Error(`Insufficient balance you need to hold ${this.GetAccountBalance(accountNumber)} XLM in your account.`);
  }

  private getNetworkPassphrase() {
    return this.GetCoinInfo().test ? this._networkTestPassphrase : this._networkPublicPassphrase;
  }

  private GetAccount(accountNumber: number) {
    if (accountNumber >= this._accounts.length) {
      throw new Error('Account number is wrong');
    }
    return this._accounts[accountNumber];
  }

  public GetCoinPath(accountNumber: number): AddressModel {
    return  PathUtil.GetBipPath(
      CoinBaseType.Ripple,
      accountNumber,
      super.GetCoinInfo()
    );
  }

  public transformSigner(signer) {
    let type = 0;
    let key;
    const {weight} = signer;
    if (typeof signer.ed25519PublicKey === 'string') {
      const keyPair = Keypair.fromPublicKey(signer.ed25519PublicKey);
      key = keyPair.rawPublicKey().toString('hex');
    }
    if (signer.preAuthTx instanceof Buffer) {
      type = 1;
      key = signer.preAuthTx.toString('hex');
    }
    if (signer.sha256Hash instanceof Buffer) {
      type = 2;
      key = signer.sha256Hash.toString('hex');
    }
    return {
      type,
      key,
      weight,
    };
  }

  public transformAsset(asset) {
    if (asset.isNative()) {
      return {
        type: 0,
        code: asset.getCode(),
      };
    }
    return {
      type: asset.getAssetType() === 'credit_alphanum4' ? 1 : 2,
      code: asset.getCode(),
      issuer: asset.getIssuer(),
    };
  }

  public transformAmount(amount) {
    return new BigNumber(amount).times(10000000).toString();
  }

  public transformType(operation): StellarOperationMessage | null {
    let operationMessage: StellarOperationMessage;
    switch (operation.type) {
      case 'payment':
        return {
          type: 'StellarPaymentOp',
          destination_account: operation.destination,
          asset: operation.asset,
          amount: operation.amount,
        }
      case 'createAccount':
        return {
          type: 'StellarCreateAccountOp',
          new_account: operation.destination,
          starting_balance: operation.startingBalance
        }
      default:
        return null;
    }
  }

  public transformMemo(signMessage: StellarSignTxMessage, memo: Memo) {
    if (memo && memo.value) {
      switch (memo.type) {
        case 'text':
          signMessage.memo_type = 1;
          signMessage.memo_text = memo.value.toString();
          break;
        case 'id':
          signMessage.memo_type = 2;
          signMessage.memo_id = memo.value.toString();
          break;
        case 'hash':

          signMessage.memo_type = 3;
          signMessage.memo_hash = Buffer.from(memo.value).toString('hex');
          break;
        case 'return':
          signMessage.memo_type = 4;
          signMessage.memo_hash = Buffer.from(memo.value).toString('hex');
          break;
        default:
          signMessage.memo_type = 0;
      }
    } else {
      signMessage.memo_type = 0;
    }
  }

  public transformTimebounds(signMessage: StellarSignTxMessage, timebounds) {
    if (!timebounds) return undefined;
    signMessage.timebounds_start = Number.parseInt(timebounds.minTime, 10);
    signMessage.timebounds_end = Number.parseInt(timebounds.maxTime, 10);
  }
}
