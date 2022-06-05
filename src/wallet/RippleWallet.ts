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

import { RippleAccount, RippleFee, RippleTransactionDataInfo } from "../blockchain/servers/prokey/src/ripple/RippleModel";
import { CoinBaseType } from "../coins/CoinInfo";
import { Device } from "../device/Device";
import { RippleCoinInfoModel } from "../models/CoinInfoModel";
import { BaseWallet } from "./BaseWallet";
import * as PathUtil from '../utils/pathUtils';
import {RippleAddress, RippleSignedTx, RippleTransaction} from "../models/Prokey";
import {ProkeyRippleBlockchain} from "../blockchain/servers/prokey/src/ripple/ProkeyRippleBlockChain";
import {BaseWalletModel} from "../models/GeneralModels";
import {RippleAccountInfo} from "../models/RippleWalletModel";
var WAValidator = require('multicoin-address-validator');

export class RippleWallet extends BaseWallet {

    private _block_chain : ProkeyRippleBlockchain;
    private _rippleWallet!: BaseWalletModel<RippleAccountInfo>;

    constructor(device: Device, coinName: string)
    {
        super(device, coinName, CoinBaseType.Ripple);
        this._block_chain = new ProkeyRippleBlockchain(this.GetCoinInfo().shortcut);
        this._rippleWallet = {totalBalance: 0};
    }

    public IsAddressValid(address: string): boolean {
        return WAValidator.validate(address, "xrp");
    }

    public async StartDiscovery(
        accountFindCallBack?: (accountInfo: RippleAccountInfo) => void
    ): Promise<BaseWalletModel<RippleAccountInfo>>
    {

        return new Promise<BaseWalletModel<RippleAccountInfo>>(async (resolve, reject) => {
          let accountIndex = 0;
          this._rippleWallet = {totalBalance: 0};
          this._rippleWallet.accounts = new Array<RippleAccountInfo>();
            do
            {
                let account = await this.GetAccountInfo(accountIndex);
                if (account == null)
                {
                    // there is nothing here
                    return resolve(this._rippleWallet);
                }
                let rippleAccountInfo = {
                  accountIndex: accountIndex,
                  balance: account.Balance ? +account.Balance : 0,
                  Account: account.Account,
                  AccountTxnID: account.AccountTxnID,
                  Domain: account.Domain,
                  EmailHash: account.EmailHash,
                  MessageKey: account.MessageKey,
                  RegularKey: account.RegularKey,
                  OwnerCount: account.OwnerCount,
                  PreviousTxnID: account.PreviousTxnID,
                  PreviousTxnLgrSeq: account.PreviousTxnLgrSeq,
                  Sequence: account.Sequence,
                  TickSize: account.TickSize,
                  TransferRate: account.TransferRate,
                  LedgerEntryType: account.LedgerEntryType,
                  Flags: account.Flags,
                  index: account.index,
                };
                this._rippleWallet.accounts.push(rippleAccountInfo);
                if (accountFindCallBack) {
                    accountFindCallBack(rippleAccountInfo);
                }
                accountIndex++;
            } while(true);
        });
    }

    // Get ripple account info from blockchain
    private async GetAccountInfo(accountNumber: number): Promise<RippleAccount | null> {
        let path = PathUtil.GetBipPath(
            CoinBaseType.Ripple,
            accountNumber,
            super.GetCoinInfo()
        )

        let address = await this.GetAddress<RippleAddress>(path.path, false);

        //! Save address
        path.address = address.address;

        //! Getting address(account) info. from blockchain
        let addressInfo = await this._block_chain.GetAddressInfo({address: address.address});

        //! Add AddressModel
        if(addressInfo != null){
            addressInfo.addressModel = path;
        }

        return addressInfo;
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
        if(!this._rippleWallet.accounts || accountNumber >= this._rippleWallet.accounts.length){
            throw new Error('Account number is wrong');
        }

        // Check balance
        let bal = 0;
        var acc = this._rippleWallet.accounts[accountNumber];
        if (acc != null && acc.balance != null) {
            bal = +acc.balance;
        }

        let ci = super.GetCoinInfo() as RippleCoinInfoModel;

        bal = bal
            - ci.min_balance // 20 XRP for reserve
            - amount
            - (+selectedFee);
        if (bal < 0)
            throw new Error("Insufficient balance you need to hold 20 XRP in your account.");

        let path = PathUtil.GetBipPath(
            CoinBaseType.Ripple,
            accountNumber,
            ci
        )

        let tx: RippleTransaction = {
            address_n: path.path,
            fee: +selectedFee,
            sequence: this._rippleWallet.accounts[accountNumber].Sequence,
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
