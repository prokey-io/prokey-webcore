import {AddressModel} from "./Prokey";
import {BaseAccountInfoModel} from "./GeneralModels";

export interface RippleAccountInfo extends BaseAccountInfoModel
{
  Account: string,
  AccountTxnID?: string,
  Domain?: string,
  EmailHash?: string,
  MessageKey?: string,
  RegularKey?: string,
  OwnerCount: number,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number,
  Sequence: number,
  TickSize: number,
  TransferRate: number,
  LedgerEntryType: string,
  Flags: number,
  index: string,

  addressModel?: AddressModel,
}
