import { AddressModel } from './Prokey';

/**
 * This is the result of account discovery
 * Result of account discovery is a Wallet with total balance and list of AccountInfo
 * @end
 */
export interface RippleWalletModel {
    totalBalance: number;
    accounts?: Array<RippleAccountInfo>;
}

export interface RippleAccountInfo {
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

    isAccountFounded: boolean;
    addressModel: AddressModel;
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
    LastLedgerSequence: number;
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
    inLedger: number;
    // The ledger index of the ledger that includes this transaction.
    ledger_index: number;
}

/**
 * This is the response model of 'fee' method
 * https://xrpl.org/fee.html
 */
export interface RippleFee {
    // in case of sucess
    // Number of transactions provisionally included in the in-progress ledger.
    current_ledger_size?: string;
    // Number of transactions currently queued for the next ledger.
    current_queue_size?: string;
    // Various information about the transaction cost (the Fee field of a transaction), in drops of XRP.
    drops?: RippleFeeDrop;
    // The approximate number of transactions expected to be included in the current ledger.
    expected_ledger_size?: string;
    // The Ledger Index of the current open ledger these stats describe.
    ledger_current_index?: number;
    // Various information about the transaction cost, in fee levels.
    levels?: RippleFeeLevels;
    // The maximum number of transactions that the transaction queue can currently hold.
    max_queue_size?: string;
}

/**
 * The transaction cost
 */
export interface RippleFeeDrop {
    // The transaction cost required for a reference transaction to be included in a ledger under minimum load,
    // represented in drops of XRP.
    base_fee: string;
    // An approximation of the median transaction cost among transactions included in the previous validated ledger,
    // represented in drops of XRP.
    median_fee: string;
    // The minimum transaction cost for a reference transaction to be queued for a later ledger, represented in drops
    // of XRP. If greater than base_fee, the transaction queue is full.
    minimum_fee: string;
    // The minimum transaction cost that a reference transaction must pay to be included in the current open ledger,
    // represented in drops of XRP.
    open_ledger_fee: string;
}

/**
 * Various information about the transaction cost, in fee levels.
 */
export interface RippleFeeLevels {
    // The median transaction cost among transactions in the previous validated ledger, represented in fee levels.
    median_level: string;
    // The minimum transaction cost required to be queued for a future ledger, represented in fee levels.
    minimum_level: string;
    // The minimum transaction cost required to be included in the current open ledger, represented in fee levels.
    open_ledger_level: string;
    // The equivalent of the minimum transaction cost, represented in fee levels.
    reference_level: string;
}

/**
 * The response model of 'submit_tx' method
 * https://xrpl.org/submit.html
 */
export interface RippleSubmitTransactionResponse {
    // Text result code indicating the preliminary result of the transaction, for example tesSUCCESS
    engine_result?: string;
    // Numeric version of the result code. Not recommended.
    engine_result_code?: number;
    // Human-readable explanation of the transaction's preliminary result
    engine_result_message?: string;
    // The complete transaction in hex string format
    tx_blob?: string;
    // The complete transaction in JSON format
    tx_json?: RippleSubmitedTransaction;
    // The value true indicates that the transaction was applied, queued, broadcast, or kept for later.
    // The value false indicates that none of those happened, so the transaction cannot possibly succeed
    // as long as you do not submit it again and have not already submitted it another time.
    accepted?: boolean;
    // The next Sequence Number available for the sending account after all pending and queued transactions.
    account_sequence_available?: number;
    // The next Sequence Number for the sending account after all transactions that have been provisionally
    // applied, but not transactions in the queue.
    account_sequence_next?: number;
    // The value true indicates that this transaction was applied to the open ledger. In this case, the transaction
    // is likely, but not guaranteed, to be validated in the next ledger version.
    applied?: boolean;
    // The value true indicates this transaction was broadcast to peer servers in the peer-to-peer XRP Ledger network.
    broadcast?: boolean;
    // The value true indicates that the transaction was kept to be retried later.
    kept?: boolean;
    // The value true indicates the transaction was put in the Transaction Queue, which means it is likely to be included in a future ledger version.
    queued?: boolean;
    //  The current open ledger cost before processing this transaction. Transactions with a lower cost are likely to be queued.
    open_ledger_cost?: string;
    // The ledger index of the newest validated ledger at the time of submission. This provides a lower bound on the ledger versions
    // that the transaction can appear in as a result of this request.
    validated_ledger_index?: number;
}

/**
 * The complete submitted transaction
 */
export interface RippleSubmitedTransaction {
    // A unique identifier for the account, most commonly the account's address.
    Account: string;
    // The amount of currency to deliver.
    Amount: {
        currency: string;
        issuer: string;
        value: string;
    };
    // The unique address of the account receiving the payment.
    Destination: string;
    // The transaction fee
    Fee: string;
    // Transaction flags
    Flags: number;
    // The sequence number of the account sending the transaction.
    Sequence: number;
    // Hex representation of the public key that corresponds to the private key used to sign this transaction.
    SigningPubKey: string;
    // The type of transaction.
    TransactionType: string;
    // The signature that verifies this transaction as originating from the account it says it is from.
    TxnSignature: string;
    // The hash of transaction
    hash: string;
}
