import {BitcoinTransactionInput} from "./BitcoinTransactionInput";
import {BitcoinTransactionOutput} from "./BitcoinTransactionOutput";

export interface TransactionInfoModel {
  txid: string,
  version: number,
  vin: Array<BitcoinTransactionInput>,
  vout: Array<BitcoinTransactionOutput>,
  blockHash: string,
  blockHeight: number,
  confirmations: number,
  blockTime: number,
  value: string,
  valueIn: string,
  fees: string,
  hex: string
}
