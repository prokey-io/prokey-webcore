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

import { RippleAccountInfo, RippleTransactionDataInfo } from "../blockchain/servers/prokey/src/ripple/RippleModel";
import { CoinBaseType } from "../coins/CoinInfo";
import { Device } from "../device/Device";
import { RippleCoinInfoModel } from "../models/CoinInfoModel";
import { BaseWallet } from "./BaseWallet";
import * as PathUtil from '../utils/pathUtils';
import { RippleAddress, RippleTransaction } from "../models/Prokey";
import { RippleBlockchain } from "../blockchain/RippleBlockchain";
var WAValidator = require('multicoin-address-validator');

export class RippleWallet extends BaseWallet {

    _block_chain : RippleBlockchain;

    constructor(device: Device, coinName: string)
    {
        super(device, coinName, CoinBaseType.Ripple);        
        this._block_chain = new RippleBlockchain(this.GetCoinInfo().shortcut);
    }
    
    public IsAddressValid(address: string): boolean {
        if(WAValidator.validate(address, "xrp")) {
            return true;
        }

        return false;
    }

    public async StartDiscovery(
        accountFindCallBack?: (accountInfo: RippleAccountInfo) => void
    ): Promise<Array<RippleAccountInfo>>
    {
        return new Promise<Array<RippleAccountInfo>>(async (resolve, reject) => {
            let an = 0;
            let res = new Array<RippleAccountInfo>();
            do
            {
                let account = await this.GetAccountInfo(an);
                if (account == null)
                {
                    // there is nothing here
                    return resolve(res);
                }
                res.push(account);
                if (accountFindCallBack) {
                    accountFindCallBack(account);
                }
                an++;
            } while(true);
        });
    }

    // Get ripple account info from blockchain
    private async GetAccountInfo(accountNumber: number): Promise<RippleAccountInfo> {
        let slip44 = (super.GetCoinInfo() as RippleCoinInfoModel).slip44;
        let path = PathUtil.GetListOfBipPath(
        slip44,                 
            0,                      // Ripple, each address is considered as an account
            1,                      // We only need an address
            false,                  // Segwit not defined so we should use 44'
            false,                  // No change address defined in ripple
            accountNumber);
        
        let address = await this.GetAddress<RippleAddress>(path[0].path, false);

        return await this._block_chain.GetAccountInfo(address.address);
    }

    public async GetAccountTransactions(account: string): Promise<Array<RippleTransactionDataInfo>> {
        return await this._block_chain.GetAccountTransactions(account);
    }
}
