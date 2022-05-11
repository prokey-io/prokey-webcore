export interface BitcoinTransactionOutput {
  value: string,
  n: number,
  hex: string,
  addresses: Array<string>,
  isAddress: boolean,
  spent: boolean
}
