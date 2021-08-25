/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
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

import { MyConsole } from '../../../../../utils/console';
import { ProkeyBaseBlockChain } from '../ProkeyBaseBlockChain';
import { TronAccountInfo, TronAccountResources, TronBlock, TronTransactionDataInfo, TronTrc20TransactionDataInfo } from './TronModel';

export class TronBlockchain extends ProkeyBaseBlockChain {

    _coinName: string;

    constructor(coinName: string) {
        super();
        this._coinName = coinName;
    }

    public async GetAccountInfo(account: string): Promise<TronAccountInfo | null> {
        try {
            let r = await this.GetFromServer<any>(`address/${this._coinName}/${account}`);
            if (!r.success) {
                MyConsole.Error("Tron get account info error: ", r);
                return null;
            }
            return r.data[0];
        } catch (error) {
            return null;
        }
    }

    // Get account resources the address must be in HEX format
    public async GetAccountResources(account: string): Promise<TronAccountResources | null> {
        try {
            let r = await this.GetFromServer<TronAccountResources>(`address/resources/${this._coinName}/${account}`);
            MyConsole.Info("Tron account resources: ", r);
            if (r.freeNetUsed == undefined) {
                r.freeNetUsed = 0;
            }
            if (r.EnergyLimit == undefined) {
                r.EnergyLimit = 0;
            }
            if (r.EnergyUsed == undefined) {
                r.EnergyUsed = 0;
            }
            if (r.tronPowerLimit == undefined) {
                r.tronPowerLimit = 0;
            }
            if (r.tronPowerUsed == undefined) {
                r.tronPowerUsed = 0;
            }
            return r;
        } catch (error) {
            MyConsole.Error("Tron get account resources error: ", error);
            return null;
        }
    }

    public async GetAccountTransactions(account: string, limit: number = 10): Promise<Array<TronTransactionDataInfo>> {
        let r = await this.GetFromServer<any>(`address/transactions/${this._coinName}/${account}/${limit}`);
        if (!r.success) {
            MyConsole.Error("Tron get account transactions error: ", r);
            return [];
        }
        MyConsole.Info("tron transactions: ", r.data);
        return r.data;
    }

    public async GetAccountTrc20Transactions(account: string, limit: number = 10): Promise<Array<TronTrc20TransactionDataInfo>> {
        let r = await this.GetFromServer<any>(`address/trc20/transactions/${this._coinName}/${account}/${limit}`);
        if (!r.success) {
            MyConsole.Error("Tron get account TRC20 transactions error: ", r);
            return [];
        }
        return r.data;
    }

    public async GetNowBlock(): Promise<TronBlock> {
        return await this.GetFromServer<TronBlock>(`block/getblockcount/${this._coinName}`);
    }

    public async GetLatestBlock(count: number): Promise<any> {
        return await this.GetFromServer<TronBlock>(`block/GetLatest/${this._coinName}/${count}`);
    }

    public async BroadCastTransaction(data: string): Promise<any> {
        return await this.GetFromServer<any>(`Transaction/send/${this._coinName}/${data}`);
    }

}