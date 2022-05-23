export interface AddressInfoModel {
  page: number,
  totalPages: number,
  itemsOnPage: number,
  address: string,
  balance: string,
  totalReceived: string,
  totalSent: string,
  unconfirmedBalance: string,
  unconfirmedTxs: number,
  txs: number,
  txids: Array<string>
}
