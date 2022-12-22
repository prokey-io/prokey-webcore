import { AddressModel } from '../../../models/Prokey';

export interface RippleRpcResponseBase {
    status: string;

    // in case of error
    error?: string;
    error_code?: number;
    error_message?: string;
    request?: {
        account: string;
        command: string;
        ledger_index: string;
        queue: boolean;
        strict: boolean;
    };
}

export interface RippleAccountInfo extends RippleRpcResponseBase {
    // in case of sucess
    account_data?: RippleAccountData;
    ledger_current_index?: number;
    queue_data?: {
        txn_count: number;
    };
    validated?: boolean;
}

export interface RippleAccountData {
    Account: string;
    AccountTxnId?: string;
    Balance?: string;
    Domain?: null;
    EmailHash?: null;
    MessageKey?: null;
    RegularKey?: null;
    OwnerCount: number;
    PreviousTxnId: string;
    PreviousTxnLgrSeq: number;
    Sequence: number;
    TickSize: number;
    TransferRate: number;
    LedgerEntryType: string;
    Flags: number;
    Index: string;

    addressModel?: AddressModel;
}

export interface RippleTransactionInfo {
    account: string;
    amount: string;
    destination: string;
    fee: string;
    flags: number;
    sequence: number;
    signingPubKey: string;
    transactionType: string;
    txnSignature: string;
    hash: string;
    date: number;
}

export interface RippleAccountTransactionResponse {
    account: string;
    ledgerIndexMax: number;
    ledgerIndexMin: number;
    limit: number;
    marker: string;
    transactions: Array<RippleTransactionDataInfo>;
    status: string;
    validated: boolean;
}

export interface RippleTransactionDataInfo {
    meta: any;
    transactionDetail: RippleTransactionInfo;
    validated: boolean;
}

export interface RippleDrop {
    baseFee: string;
    medianFee: string;
    minimumFee: string;
    openLedgerFee: string;
}

export interface RippleFee {
    currentLedgerSize: string;
    currentQueueSize: string;
    drops: RippleDrop;
    expectedLedgerSize: string;
    ledgerCurrentIndex: number;
    levels: any;
    maxQueueSize: string;
    status: string;
    validated: boolean;
}

export interface RippleTransactionResponse {
    status: string;

    // In Case of accept
    accepted?: boolean;
    account_sequence_available?: number;
    account_sequence_next?: number;
    applied?: boolean;
    broadcast?: boolean;
    engine_result?: string;
    engine_result_code?: number;
    engine_result_message?: string;
    kept?: boolean;
    open_ledger_cost?: string;
    queued?: boolean;
    tx_blob?: string;
    tx_json?: {
        Account: string;
        Amount: {
            currency: string;
            issuer: string;
            value: string;
        };
        Destination: string;
        Fee: string;
        Flags: number;
        Sequence: number;
        SigningPubKey: string;
        TransactionType: string;
        TxnSignature: string;
        hash: string;
    };
    validated_ledger_index?: number;

    // In case of error
    error?: string;
    error_exception?: string;
    request?: {
        command: string;
        tx_blob: string;
    };
}
