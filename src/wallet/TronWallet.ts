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

import { CoinBaseType } from "../coins/CoinInfo";
import { Device } from "../device/Device";
import { TronCoinInfoModel } from "../models/CoinInfoModel";
import { BaseWallet } from "./BaseWallet";
import * as PathUtil from '../utils/pathUtils';
import { TronAddress, TronSignedTx, TronTransaction } from "../models/Prokey";
import { TronBlockchain } from "../blockchain/servers/prokey/src/tron/TronBlockchain";
import { TronAccountInfo, TronBlock, TronTransactionDataInfo } from "../blockchain/servers/prokey/src/tron/TronModel";
import * as Utils from '../utils/utils';
var WAValidator = require('multicoin-address-validator');

export class TronWallet extends BaseWallet {

    _block_chain : TronBlockchain;
    _accounts: Array<TronAccountInfo>;

    constructor(device: Device, coinName: string)
    {
        super(device, coinName, CoinBaseType.Tron);        
        this._block_chain = new TronBlockchain(this.GetCoinInfo().shortcut);
        this._accounts = [];
    }
    
    public IsAddressValid(address: string): boolean {
        if(WAValidator.validate(address, "trx")) {
            return true;
        }

        return false;
    }

    public async StartDiscovery(
        accountFindCallBack?: (accountInfo: TronAccountInfo) => void
    ): Promise<Array<TronAccountInfo>>
    {
        return new Promise<Array<TronAccountInfo>>(async (resolve, reject) => {
            let an = 0;
            this._accounts = new Array<TronAccountInfo>();
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

    // Get Tron account info from blockchain
    private async GetAccountInfo(accountNumber: number): Promise<TronAccountInfo | null> {
        let slip44 = (super.GetCoinInfo() as TronCoinInfoModel).slip44;
        let path = PathUtil.GetListOfBipPath(
        slip44,                 
            accountNumber,          // Tron, each address is considered as an account
            1,                      // We only need an address
            false,                  // Segwit not defined so we should use 44'
            false,                  // No change address defined in Tron
            0);
        
        let address = await this.GetAddress<TronAddress>(path[0].path, false);

        return await this._block_chain.GetAccountInfo(address.address);
    }

    public async GetAccountTransactions(account: string): Promise<Array<TronTransactionDataInfo>> {
        return await this._block_chain.GetAccountTransactions(account);
    }

    public async GetNowBlock(): Promise<TronBlock>
    {
        return await this._block_chain.GetNowBlock();
    }

    public async GenerateTransaction(toAccount: string, amount: number, accountNumber: number): Promise<TronTransaction>
    {
        // Validate accountNumber
        if(accountNumber >= this._accounts.length){
            throw new Error('Account number is wrong');
        }

        // Check balance
        let bal = 0;
        var acc = this._accounts[accountNumber];
        if (acc != null && acc.balance != null) {
            bal = acc.balance;
        }

        bal = bal - amount;
        if (bal < 0)
            throw new Error("Insufficient balance in your account.");

        let ci = super.GetCoinInfo() as TronCoinInfoModel
        let slip44 = ci.slip44;
        let path = PathUtil.GetListOfBipPath(
            slip44,                 
            accountNumber,          // Tron, each address is considered as an account
            1,                      // We only need an address
            false,                  // Segwit not defined so we should use 44'
            false,                  // No change address defined in Tron
            0);

        // get the now block
        let last_block = await this._block_chain.GetLatestBlock(1);
        let now_block = last_block.block[0] as TronBlock;
        let tx: TronTransaction = {
            address_n: path[0].path,
            timestamp: Date.now(),
            block_id: now_block.blockID,
            contract: {
                transfer_contract: {
                    to_address: toAccount,
                    amount: amount
                }
            }
        };
        return tx;
    }

    public async SendTransaction(tx: TronSignedTx): Promise<any> {
        let data_any = tx.serialized_tx as any;
        if (data_any instanceof Uint8Array)
        {            
            return await this._block_chain.BroadCastTransaction(
                Utils.ByteArrayToHexString(data_any).toUpperCase());            
        }

        return await this._block_chain.BroadCastTransaction(tx.serialized_tx);
    }
}
