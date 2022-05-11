export interface BitcoinTransactionInputDetail {
  txid: string,
  vout: 5,
  scriptSig: {
    asm: string,
    hex: string
  },
  txinwitness: Array<string>,
  sequence: number
}
