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

import { ProkeyBaseBlockChain } from "../ProkeyBaseBlockChain";
import { RippleAccountInfo } from "./RippleModel";

export class ProkeyRippleBlockchain extends ProkeyBaseBlockChain {

    _coinName: string;

    constructor(coinNameOrShortcut: string = "xrp")
    {
        super();
        this._coinName = coinNameOrShortcut;
    }

    public async GetAccountInfo(account: string): Promise<RippleAccountInfo>
    {        
        try {
            return await this.GetFromServer<RippleAccountInfo>(`address/${this._coinName}/${account}`);            
        } catch (error) {
            return null;
        }
    }

    public async GetAccountTransactions(account: string, limit: number = 10): Promise<any>
    {
        return await this.GetFromServer<any>(`address/transactions/${this._coinName}/${account}/${limit}`);
    }
}