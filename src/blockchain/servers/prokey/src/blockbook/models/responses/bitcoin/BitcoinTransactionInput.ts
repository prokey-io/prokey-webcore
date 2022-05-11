export interface BitcoinTransactionInput {
  txid: string,
  vout: number,
  sequence: number,
  n: number,
  addresses: Array<string>,
  isAddress: boolean,
  value: string,
  hex: string
}
