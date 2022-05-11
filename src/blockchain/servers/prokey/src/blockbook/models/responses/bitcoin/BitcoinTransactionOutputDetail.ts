export interface BitcoinTransactionOutputDetail {
  value: number,
  n: number,
  scriptPubKey: {
    asm: string,
    hex: string,
    address: string,
    type: string
  }
}
