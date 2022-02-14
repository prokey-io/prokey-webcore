export interface NemAccountInfo {
  meta: {
    status: "LOCKED",
    remoteStatus: "ACTIVE",
  },
  account: NemAccount,
}

export interface NemAccount {
  address: string,
  harvestedBlocks: number,
  balance: number,
  importance: number,
  vestedBalance: number,
  publicKey: string,
  label: null, // this field is always null
  multisigInfo: {},
}

export interface NemBlock {
  timeStamp: number,
  signature: string,
  prevBlockHash:
    {
      data: string
    },
  type: number,
  transactions: NemTransaction[],
  version: number,
  signer: string,
  height: number,
}

export interface NemAccountTransactionResponse {
  data: Array<NemTransactionResponse>,
}

export interface NemTransactionResponse {
  meta: NemTransactionMeta,
  transaction: NemTransaction,
}

export interface NemTransactionMeta {
  id: number,
  hash: { data: string },
  height: number,
}

export interface NemTransaction {
  timeStamp: number,
  amount: number,
  signature: string,
  fee: number,
  recipient: string,
  type: number,
  deadline: number,
  message: {
    payload: string,
    type: number,
  },
  version: number,
  signer: string,
}

export interface NemSubmitTransaction {
  data: string,
  signature: string,
}

export interface SubmitTransactionResponse {
  type: number,
  code: number,
  message: string,
  transactionHash: {
    data: string,
  },
  innerTransactionHash: {
    data: string,
  }
}
