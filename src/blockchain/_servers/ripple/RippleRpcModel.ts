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
 *  account_info(https://xrpl.org/account_info.html) -> The account_info command retrieves information about an account, 
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
 *  account_tx(https://xrpl.org/account_tx.html) -> The account_tx method retrieves a list of transactions that involved the 
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
export interface RippleAccountInfo extends RippleRpcResponseBase {
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
    },
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
