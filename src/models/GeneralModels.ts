export interface BaseWalletModel<T extends BaseAccountInfoModel> {
  totalBalance: number,
  accounts?: Array<T>,
}

export interface BaseAccountInfoModel {
  balance: number,
  accountIndex: number
}
