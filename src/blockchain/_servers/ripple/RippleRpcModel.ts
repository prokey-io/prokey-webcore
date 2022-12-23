/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) 2022 Prokey.io
 * 
 * Hadi Robati, hadi@prokey.io
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { AddressModel } from '../../../models/Prokey';

/**
 * Request methods:
 *  > account_info(https://xrpl.org/account_info.html) -> The account_info command retrieves information about an account,
 *  its activity, and its XRP balance.
 *      The RPC request model:
 *      {
 *          "method": "account_info",
 *          "params": [
 *              {
 *                  "account" -> A unique identifier for the account, most commonly the account's Address.,
 *                  "strict" -> (Optional) If true, then the account field only accepts a public key or XRP Ledger address.
 *                      Otherwise, account can be a secret or passphrase (not recommended). The default is false.
 *                  "ledger_index" -> (Optional) The ledger index of the ledger to use, or a shortcut string to choose a ledger automatically.
 *                  "queue" -> (Optional) If true, and the FeeEscalation amendment is enabled, also returns stats about queued
 *                      transactions associated with this account. Can only be used when querying for the data from the current open ledger.
 *              }
 *          ]
 *      }
 *
 *  > account_tx(https://xrpl.org/account_tx.html) -> The account_tx method retrieves a list of transactions that involved the
 *  specified account
 *      The RPC request model:
 *      {
 *          "method": "account_tx",
 *          "params": [
 *              {
 *                  "account" -> A unique identifier for the account, most commonly the account's address.
 *                  "binary" -> (Optional) Defaults to false. If set to true, returns transactions as hex strings instead of JSON.
 *                  "forward" -> (Optional) Defaults to false. If set to true, returns values indexed with the oldest ledger first.
 *                      Otherwise, the results are indexed with the newest ledger first.
 *                  "ledger_index_max" -> Optional) Use to specify the most recent ledger to include transactions from. A value of -1
 *                      instructs the server to use the most recent validated ledger version available.
 *                  "ledger_index_min" -> (Optional) Use to specify the earliest ledger to include transactions from. A value of -1
 *                      instructs the server to use the earliest validated ledger version available.
 *                  "limit" -> (Optional) Default varies. Limit the number of transactions to retrieve. The server is not required to honor this value.
 *              }
 *          ]
 *      }
 *
 *  > fee(https://xrpl.org/fee.html) -> The fee command reports the current state of the open-ledger requirements for the transaction cost.
 *      The RPC request model:
 *      {
 *          "method": "fee",
 *          "params": [{}]
 *      }
 *
 *  > submit(https://xrpl.org/submit.html) -> The submit method applies a transaction and sends it to the network to be confirmed and included in future ledgers.
 *      The RPC request model(Submit-Only Mode):
 *      {
 *          "method": "submit",
 *          "params": [
 *              {
 *                  "tx_blob" -> Hex representation of the signed transaction to submit.
 *              }
 *          ]
 *      }
 */

/**
 * Ripple base response
 */
export interface RippleRpcResponseBase {
    // The value success indicates the request was successfully received and understood by the server.
    status: string;

    // in case of error
    error?: string;
    error_code?: number;
    error_message?: string;
    request?: any;
}

/**
 * This is the response model of 'account_info' method
 */
export interface RippleAccountInfoResponse extends RippleRpcResponseBase {
    // in case of sucess
    // actual account data
    account_data?: RippleAccountData;
    ledger_current_index?: number;
    queue_data?: {
        txn_count: number;
    };
    validated?: boolean;
}

/**
 * Account data
 * https://xrpl.org/accountroot.html
 */
export interface RippleAccountData {
    // The identifying (classic) address of this account.
    Account: string;
    // The identifying hash of the transaction most recently sent by this account.
    AccountTxnId?: string;
    // The account's current XRP balance in drops, represented as a string.
    Balance?: string;
    // A domain associated with this account. In JSON, this is the hexadecimal for the ASCII representation of the domain.
    Domain?: null;
    // The md5 hash of an email address.
    EmailHash?: null;
    // A public key that may be used to send encrypted messages to this account.
    MessageKey?: null;
    // The address of a key pair that can be used to sign transactions for this account instead of the master key.
    RegularKey?: null;
    // The number of objects this account owns in the ledger, which contributes to its owner reserve.
    OwnerCount: number;
    // The identifying hash of the transaction that most recently modified this object.
    PreviousTxnId: string;
    // The index of the ledger that contains the transaction that most recently modified this object.
    PreviousTxnLgrSeq: number;
    // The sequence number of the next valid transaction for this account.
    Sequence: number;
    // How many significant digits to use for exchange rates of Offers involving currencies issued by this address. Valid values are 3 to 15, inclusive.
    TickSize: number;
    // A transfer fee to charge other users for sending currency issued by this account to each other.
    TransferRate: number;
    // The value 0x0061, mapped to the string AccountRoot, indicates that this is an AccountRoot object.
    LedgerEntryType: string;
    // A bit-map of boolean flags enabled for this account.
    Flags: number;
    // Index
    index: string;

    addressModel?: AddressModel;
}

/**
 * This is the response model of 'account_tx' method
 */
export interface RippleAccountTxResponse extends RippleRpcResponseBase {
    // in case of sucess
    // A unique identifier for the account, most commonly the account's address.
    account?: string;
    // The ledger index of the most recent ledger actually searched for transactions.
    ledger_index_max?: number;
    // The ledger index of the earliest ledger actually searched for transactions.
    ledger_index_min?: number;
    // The limit value used in the request. (This may differ from the actual limit value enforced by the server.)
    limit?: number;
    // Server-defined value indicating the response is paginated. Pass this to the next call to resume where this call left off.
    marker?: {
        ledger: number;
        seq: number;
    };
    // Array of transactions matching the request's criteria.
    transactions?: RippleTransactionDataInfo[];
    // If included and set to true, the information in this response comes from a validated ledger version. Otherwise, the information is subject to change.
    validated?: boolean;
}

/**
 * Transaction info
 */
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

/**
 * Actual transaction info
 */
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
 * The response model of 'fee' method
 * https://xrpl.org/fee.html
 */
export interface RippleFeeResponse extends RippleRpcResponseBase {
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
export interface RippleSubmitTransactionResponse extends RippleRpcResponseBase {
    // In case of sucess
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
