import { AddressModel } from './Prokey';

/**
 * This is the result of account discovery
 * Result of account discovery is a Wallet with total balance and list of AccountInfo
 * @end
 */
export interface RippleWalletModel {
    totalBalance: number,
    accounts?: Array<RippleAccountInfo>,
}

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

    isAccountFounded: boolean,
    addressModel: AddressModel
}

export interface RippleAccountTransactionResponse {
    account: string,
    ledgerIndexMax: number,
    ledgerIndexMin: number,
    limit: number,
    marker: string,
    transactions: Array<RippleTransactionDataInfo>,
    status: string,
    validated: boolean
}

export interface RippleTransactionDataInfo {
    // The ledger index of the ledger version that included this transaction.
    ledger_index: number;
    // If binary is True, then this is a hex string of the transaction metadata. Otherwise, the transaction metadata is included in JSON format.
    meta: any;
    // JSON object defining the transaction. (JSON mode only)
    tx?: RippleTransactionInfo;
    // Unique hashed String representing the transaction. (Binary mode only)
    tx_blob?: string;
    // Whether or not the transaction is included in a validated ledger. Any transaction not yet in a validated ledger is subject to change.
    validated: boolean;
}

export interface RippleTransactionInfo {
    // A unique identifier for the account, most commonly the account's address.
    Account: string;
    // The amount of currency to deliver.
    Amount: string;
    // The unique address of the account receiving the payment.
    Destination: string;
    // The fee of transaction
    Fee: string;
    // Transaction flags
    Flags: number;
    // Highest ledger index this transaction can appear in.
    LastLedgerSequence: number,
    // The sequence number of the account sending the transaction. A transaction is only valid if the Sequence number 
    // is exactly 1 greater than the previous transaction from the same account.
    Sequence: number;
    // Hex representation of the public key that corresponds to the private key used to sign this transaction.
    SigningPubKey: string;
    // The type of transaction. Valid types include:
    // Payment, OfferCreate, OfferCancel, TrustSet, AccountSet, AccountDelete, SetRegularKey, SignerListSet, EscrowCreate, EscrowFinish, 
    // EscrowCancel, PaymentChannelCreate, PaymentChannelFund, PaymentChannelClaim, and DepositPreauth.
    TransactionType: string;
    // The signature that verifies this transaction as originating from the account it says it is from.
    TxnSignature: string;
    // The hash of transaction
    hash: string;
    // Ledger number
    inLedger: number,
    // The ledger index of the ledger that includes this transaction.
    ledger_index: number,
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
