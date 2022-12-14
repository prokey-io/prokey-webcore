import { AddressModel } from '../../../models/Prokey';

export interface RippleAccountInfo {
    Account: string,
    AccountTxnId?: string,
    Balance?: string,
    Domain?: null,
    EmailHash?: null,
    MessageKey?: null,
    RegularKey?: null,
    OwnerCount: number,
    PreviousTxnId: string,
    PreviousTxnLgrSeq: number,
    Sequence: number,
    TickSize: number,
    TransferRate: number,
    LedgerEntryType: string,
    Flags: number,
    Index: string,

    addressModel?: AddressModel
}

export interface RippleTransactionInfo {
    account: string,
    amount: string,
    destination: string,
    fee: string,
    flags: number,
    sequence: number,
    signingPubKey: string,
    transactionType: string,
    txnSignature: string,
    hash: string,
    date: number,
}

export interface RippleAccountTransactionResponse {
    'account': string,
    'ledgerIndexMax': number,
    'ledgerIndexMin': number,
    'limit': number,
    'marker': string,
    'transactions': Array<RippleTransactionDataInfo>,
    'status': string,
    'validated': boolean
}

export interface RippleTransactionDataInfo {
    meta: any,
    transactionDetail: RippleTransactionInfo,
    validated: boolean
}

export interface RippleDrop {
    baseFee: string,
    medianFee: string,
    minimumFee: string,
    openLedgerFee: string
}

export interface RippleFee {
    currentLedgerSize: string,
    currentQueueSize: string,
    drops: RippleDrop,
    expectedLedgerSize: string,
    ledgerCurrentIndex: number,
    levels: any,
    maxQueueSize: string,
    status: string,
    validated: boolean
}

export interface RippleTransactionResponse {
    status: string,
    validated: boolean,
    accepted: boolean,
    accountSequenceAvailable: number,
    accountSequenceNext: number,
    applied: boolean,
    broadcast: boolean,
    engineResult: string,
    engineResultCode: number,
    engineResultMessage: string,
    kept: boolean,
    openLedgerCost: string,
    queued: boolean,
    txBlob: string,
    txJson: {
        account: string,
        amount: string,
        destination: string,
        fee: string,
        flags: number,
        sequence: number,
        signingPubKey: string,
        transactionType: string,
        txnSignature: string,
        hash: string
    }
}