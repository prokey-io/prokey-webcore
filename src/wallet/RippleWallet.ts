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

import { RippleAccountInfo, RippleFee, RippleTransactionDataInfo } from "../blockchain/servers/prokey/src/ripple/RippleModel";
import { CoinBaseType } from "../coins/CoinInfo";
import { Device } from "../device/Device";
import { RippleCoinInfoModel } from "../models/CoinInfoModel";
import { BaseWallet } from "./BaseWallet";
import * as PathUtil from '../utils/pathUtils';
import { RippleAddress, RippleSignedTx, RippleTransaction } from "../models/Prokey";
import { RippleBlockchain } from "../blockchain/RippleBlockchain";
var WAValidator = require('multicoin-address-validator');

export class RippleWallet extends BaseWallet {

    _block_chain : RippleBlockchain;
    _accounts: Array<RippleAccountInfo>;

    constructor(device: Device, coinName: string)
    {
        super(device, coinName, CoinBaseType.Ripple);        
        this._block_chain = new RippleBlockchain(this.GetCoinInfo().shortcut);
        this._accounts = [];
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
            this._accounts = new Array<RippleAccountInfo>();
            do
            {
                let account = await this.GetAccountInfo(an);
                if (account == null)
                {
                    // there is nothing here
                    return resolve(this._accounts);
                }
                this._accounts.push(account);
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
            accountNumber,          // Ripple, each address is considered as an account
            1,                      // We only need an address
            false,                  // Segwit not defined so we should use 44'
            false,                  // No change address defined in ripple
            0);
        
        let address = await this.GetAddress<RippleAddress>(path[0].path, false);

        return await this._block_chain.GetAccountInfo(address.address);
    }

    public async GetAccountTransactions(account: string): Promise<Array<RippleTransactionDataInfo>> {
        return await this._block_chain.GetAccountTransactions(account);
    }

    public async GetCurrentFee(): Promise<RippleFee>
    {
        return await this._block_chain.GetCurrentFee();
    }

    public GenerateTransaction(toAccount: string, amount: number, accountNumber: number, selectedFee: string, destinationTag?: number): RippleTransaction
    {
        // Validate accountNumber
        if(accountNumber >= this._accounts.length){
            throw new Error('Account number is wrong');
        }

        // Check balance
        let bal = +this._accounts[accountNumber].Balance;
        bal = bal 
            - 20000000 // 20 XRP for reserve
            - amount
            - (+selectedFee);
        if (bal < 0)
            throw new Error("Insufficient balance you need to hold 20 XRP in your account.");

        let ci = super.GetCoinInfo() as RippleCoinInfoModel
        let slip44 = ci.slip44;
        let path = PathUtil.GetListOfBipPath(
        slip44,                 
            accountNumber,          // Ripple, each address is considered as an account
            1,                      // We only need an address
            false,                  // Segwit not defined so we should use 44'
            false,                  // No change address defined in ripple
            0);
            
        let tx: RippleTransaction = {
            address_n: path[0].path,
            fee: +selectedFee,
            sequence: this._accounts[accountNumber].Sequence,
            payment: {
                amount: amount,
                destination: toAccount,                
            }
        };
        if (destinationTag)
        {
            tx.payment.destination_tag = destinationTag;
        }
        return tx;
    }

    public async SendTransaction(tx: RippleSignedTx): Promise<any> {
        return await this._block_chain.BroadCastTransaction(tx.serialized_tx);
    }
}
