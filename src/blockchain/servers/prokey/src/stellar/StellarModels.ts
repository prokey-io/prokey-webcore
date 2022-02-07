/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
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

export interface StellarFee {
  "last_ledger": string,
  "last_ledger_base_fee": string,
  "ledger_capacity_usage": string,
  "min_accepted_fee": string,
  "mode_accepted_fee": string,
  "p10_accepted_fee": string,
  "p20_accepted_fee": string,
  "p30_accepted_fee": string,
  "p40_accepted_fee": string,
  "p50_accepted_fee": string,
  "p60_accepted_fee": string,
  "p70_accepted_fee": string,
  "p80_accepted_fee": string,
  "p90_accepted_fee": string,
  "p95_accepted_fee": string,
  "p99_accepted_fee": string,
  "fee_charged": FeeState,
  "max_fee": FeeState
}

export interface StellarAccountInfo {
  account_id: string,
  sequence: number,
  subentry_count: number,
  inflation_destination: string,
  home_domain: string,
  thresholds: Thresholds,
  flags: Flags,
  balances: Balance[],
  signers: Signer[],
  num_sponsoring: number,
  num_sponsored: number,
  Data: object
}

export interface StellarTransactionResponse {
  "transactions": StellarTransaction[],
  "nextPageCursor": string,
  "prevPageCursor": string
}

export interface StellarTransaction {
  "hash": string,
  "ledger": number,
  "created_at": string,
  "source_account": string,
  "fee_account": string,
  "successful": boolean,
  "paging_token": string,
  "source_account_sequence": number,
  "fee_charged": number,
  "max_fee": number,
  "operation_count": number,
  "envelope_xdr": string,
  "result_xdr": string,
  "result_meta_xdr": string,
  "signatures": string[],
  "fee_bump_transaction": FeeBumpTransaction,
  "inner_transaction": InnerTransaction,
  "memo_type": string,
  "memo": string,
  "memo_bytes": string
}

export interface StellarTransactionOperationResponse {
  "operations": StellarTransactionOperation[],
  "nextPageCursor": string,
  "prevPageCursor": string
}

export interface StellarTransactionOperation {
  "id": number,
  "source_account": string,
  "paging_token": string,
  "type": string,
  "type_i": number,
  "created_at": string,
  "transaction_hash": string,
  "transaction_successful": boolean
  "asset_type": string,
  "from": string,
  "to": string,
  "amount": string,
  "name": string,
  "value": string,
  "funder": string,
  "account": string,
  "starting_balance": string
}

interface FeeState {
  "max": string;
  "min": string;
  "mode": string;
  "p10": string;
  "p20": string;
  "p30": string;
  "p40": string;
  "p50": string;
  "p60": string;
  "p70": string;
  "p80": string;
  "p90": string;
  "p95": string;
  "p99": string;
}

export interface FeeBumpTransaction {
  "hash": string,
  signatures: string[]
}

export interface InnerTransaction {
  "hash": string,
  signatures: string,
  max_fee: number
}

export interface Thresholds {
  low_threshold: number,
  med_threshold: number,
  high_threshold: number
}

export interface Flags {
  auth_required: boolean,
  auth_revocable: boolean,
  auth_immutable: boolean
}

export interface Balance {
  asset_type: string,
  asset_code: string,
  asset_issuer: string,
  limit: string,
  balance: string,
  buying_liabilities: string,
  selling_liabilities: string,
  is_authorized: boolean,
  is_authorized_to_maintain_liabilities: boolean
}

export interface Signer {
  key: string,
  type: string,
  weight: number
}
