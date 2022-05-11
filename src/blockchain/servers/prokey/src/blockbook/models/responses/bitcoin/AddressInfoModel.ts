export interface AddressInfoModel {
  page: number,
  totalPages: number,
  itemsOnPage: number,
  address: string,
  balance: number,
  totalReceived: number,
  totalSent: string,
  unconfirmedBalance: string,
  unconfirmedTxs: number,
  txs: number,
  txids: Array<string>
}
