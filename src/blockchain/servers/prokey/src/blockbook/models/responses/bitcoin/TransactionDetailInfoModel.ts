import {BitcoinTransactionInputDetail} from "./BitcoinTransactionInputDetail";
import {BitcoinTransactionOutputDetail} from "./BitcoinTransactionOutputDetail";

export interface TransactionDetailInfoModel {
  txid: string,
  hash: string,
  version: number,
  size: number,
  vsize: number,
  weight: number,
  locktime: number,
  vin: Array<BitcoinTransactionInputDetail>,
  vout: Array<BitcoinTransactionOutputDetail>,
  hex: string,
  blockhash: string,
  confirmations: number,
  time: number,
  blocktime: number
}
