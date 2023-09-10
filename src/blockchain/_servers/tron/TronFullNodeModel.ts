/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) 2023 Prokey.io
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

export interface TronFrozenModel {
    // In Stake 1.0, the total amount of TRX staked by the account to obtain bandwidth
    frozen_balance: number;
    // In Stake 1.0, the expiration time of the stake operation performed by the account to obtain bandwidth. The account can perform the unstake operation after that time.
    expire_time: number;
}

export interface TronAccountResource {
    frozen_balance_for_energy: TronFrozenModel;
    // In Stake 1.0, the total amount of TRX staked by the account for others to get energy
    delegated_frozen_balance_for_energy: number;
    // In Stake 1.0, the total amount of TRX staked by other accounts for this account to get energy
    acquired_delegated_frozen_balance_for_energy: number;
    // In Stake 2.0, the total amount of TRX staked by the account for others to get energy
    delegated_frozenV2_balance_for_energy: number;
    // In Stake 2.0, the total amount of TRX staked by other accounts for this account to get energy
    acquired_delegated_frozenV2_balance_for_energy: number;
    // The number of block times required for to fully recover. If energy_window_optimized is true, energy_window_size's decimal is 3, else is 0. 
    // For example, when energy_window_optimized=true, then energy_window_size=1000 means that it takes one block time for energy to fully recovery; if energy_window_optimized=false, then energy_window_size=1000 means that it takes 1000 blocks time for energy to fully recovery
    energy_window_size: number;
    // Whether to optimize energy recover window
    energy_window_optimized: boolean;
    // The amount of energy used by the account
    energy_usage: number;
    // The last time the account consumed energy
    latest_consume_time_for_energy: number;
}

export interface TronKeyValue {
    key: string;
    value: number;
}

/**
 * /wallet/getaccount
 * Query information about an account, including TRX balance, TRC-10 balances, stake information and vote information and permissions etc. (Confirmed state)
 */
export interface TronAccountInfo {
    // The name of the account.
    account_name: string;
    // Account address
    address: string;
    // Account creation time, i.e. account activation time on the TRON network
    create_time: number;
    // TRX balance
    balance: number;
    // frozen
    frozen?: TronFrozenModel;
    // In Stake 1.0, the total amount of TRX staked by the account for others to get bandwidth
    delegated_frozen_balance_for_bandwidth?: number;
    // In Stake 1.0, the total amount of TRX staked by other accounts for this account to get bandwidth
    acquired_delegated_frozen_balance_for_bandwidth?: number;
    // account resource
    account_resource?: TronAccountResource;
    // In Stake 2.0, the total amount of TRX staked by other accounts for this account to get bandwidth
    delegated_frozenV2_balance_for_bandwidth?: number;
    // In Stake 2.0, the total amount of TRX staked to obtain various types of resources does not include the delegated TRX
    frozenV2?: any;
    // In Stake 2.0, each unstaking information.
    unfrozenV2?: any;
    // The amount of bandwidth used by the account
    net_usage?: number;
    // 	The amount of free bandwidth used by the account
    free_net_usage?: number;
    // The number of block times required for bandwidth obtained by stake to fully recover. If net_window_optimized is true, net_window_size's decimal is 3, else is 0.
    net_window_size?: number;
    // Whether to optimize net recover window
    net_window_optimized?: boolean;
    // The amount of trc10's free bandwidth used by this account
    free_asset_net_usageV2?: TronKeyValue[];
    // The number of votes for each Super Representative
    votes?: any;
    // The last operation time
    latest_opration_time?: number;
    // The last time the account consumed bandwidth
    latest_consume_time?: number;
    // The last time the account consumed free bandwidth
    latest_consume_free_time?: number;
    // Is Super Representative
    is_witness?: boolean;
    // The amount of rewards that can be withdrawn for the account
    allowance?: number;
    // The last time the account has withdrawn the reward, the super representative or user can only withdraw the reward once within 24 hours
    latest_withdraw_time?: number;
    // owner permissions
    owner_permission?: any;
    // witness permissions
    witness_permission?: any;
    // active permission
    active_permission?: any;
    // The token id and balance of the TRC10 token in the account
    asset?: TronKeyValue[];
    // The token id and balance of the TRC10 token in the account. Note, the V2 version is used after allowing token with same name and the proposal has been activated at present.
    assetV2?: TronKeyValue[];
    // The name of the TRC10 token created by the account
    asset_issued_name?: string;
    // TRC10 token ID created by the account
    asset_issued_ID?: string;
    // The amount of free bandwidth consumed by account transferring TRC10 tokens
    free_asset_net_usage?: TronKeyValue[];
}
