/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
 * Hadi Robati, hadi@prokey.io
 * Ali Akbar Mohammadi
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

export enum TronResourceCode {
    BANDWIDTH = 0x00,
    ENERGY = 0x01,
}

export type TronFreezeBalance = {
    frozen_balance: number; // Amount to freeze
    frozen_duration?: number; // (Optional)Freeze minimal duration in days currently 3 days is fixed on tron network
    resource: TronResourceCode; // Freeze the balance to get bandwidth or energy
    receiver_address?: string; // (Optional)Energy or bandwidth receiver address
};

// Unfreeze TRX Balance
export type TronUnfreezeBalance = {
    resource: TronResourceCode; // Unfreeze the bandwidth or energy
    receiver_address: string; // (Optional)Energy or bandwidth receiver address
};

export type TronTransaction = {
    address_n: Array<number>;
    timestamp: number; // UTC timestamp
    expiration?: number; // Transaction expiration
    block_id: string; // Now block ID
    fee_limit?: number; // Max fee in TRX when calling contract address
    contract: {
        // Transfer TRX
        transfer_contract?: {
            to_address: string; // To address
            amount: number; // TRX amount in sun (10^-6)
        };
        // Freeze TRX balance
        freeze_balance_contract?: TronFreezeBalance;
    };
};
