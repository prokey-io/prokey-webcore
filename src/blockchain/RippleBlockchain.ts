/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
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

import { ProkeyRippleBlockchain } from './servers/prokey/src/ripple/ProkeyRippleBlockChain';
import { RippleAccountInfo, RippleTransactionDataInfo } from './servers/prokey/src/ripple/RippleModel';

export class RippleBlockchain {
    _prokeyChain: ProkeyRippleBlockchain;

    constructor(coinName: string){
        this._prokeyChain = new ProkeyRippleBlockchain(coinName);
    }
   
    public async GetAccountInfo(rippleAddress: string): Promise<RippleAccountInfo> {
        return await this._prokeyChain.GetAccountInfo(rippleAddress);
    }

    public async GetAccountTransactions(account: string, limit: number = 10): Promise<Array<RippleTransactionDataInfo>> {
        return await this._prokeyChain.GetAccountTransactions(account, limit);
    }
}