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

import { CoinBaseType } from "../coins/CoinInfo";
import { Device } from "../device/Device";
import { RippleCoinInfoModel } from "../models/CoinInfoModel";
import { BaseWallet } from "./BaseWallet";
import * as PathUtil from '../utils/pathUtils';
import {AddressModel, RippleAddress, RippleSignedTx, RippleTransaction} from "../models/Prokey";
import {RippleBlockchain} from "../blockchain/RippleBlockchain";
import {
  RippleAccountInfo,
  RippleFee,
  RippleTransactionDataInfo, RippleTransactionResponse
} from "../blockchain/_servers/prokey/ripple/ProkeyRippleModel";
var WAValidator = require('multicoin-address-validator');

export class RippleWallet extends BaseWallet {

    // _block_chain : ProkeyRippleBlockchain;
    _rippleBlockchain: RippleBlockchain;
    _accounts: Array<RippleAccountInfo>;

    constructor(device: Device, coinName: string)
    {
        super(device, coinName, CoinBaseType.Ripple);

        this._rippleBlockchain = new RippleBlockchain(super.GetCoinInfo());
        this._accounts = [];
    }

    public IsAddressValid(address: string): boolean {
        return WAValidator.validate(address, "xrp");
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
                    if (this._accounts.length == 0) {
                        let path = PathUtil.GetBipPath(
                            CoinBaseType.Ripple,
                            an,
                            super.GetCoinInfo()
                        )
                        let address = await this.GetAddress<RippleAddress>(path.path, false);
                        path.address = address.address;

                        let emptyAccount: RippleAccountInfo = {
                            balance: "0",
                            account: address.address,
                            ownerCount: 0,
                            previousTxnId: "",
                            previousTxnLgrSeq: 0,
                            sequence: 0,
                            tickSize: 0,
                            transferRate: 0,
                            ledgerEntryType: "",
                            flags: 0,
                            index: "",

                            addressModel: path
                        };
                        if (accountFindCallBack) {
                            accountFindCallBack(emptyAccount);
                        }
                        this._accounts.push(emptyAccount);
                    }
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
    private async GetAccountInfo(accountNumber: number): Promise<RippleAccountInfo | null> {
        let path = PathUtil.GetBipPath(
            CoinBaseType.Ripple,
            accountNumber,
            super.GetCoinInfo()
        )

        let address = await this.GetAddress<RippleAddress>(path.path, false);

        //! Save address

        //! Getting address(account) info. from blockchain
        let reqAdd: AddressModel = {address: address.address, path: path.path};
        let addressInfo = await this._rippleBlockchain.GetAddressInfo(reqAdd);

        //! Add AddressModel
        if(addressInfo != null){
            addressInfo.addressModel = path;
        }

        return addressInfo;
    }

    public async GetAccountTransactions(account: string): Promise<Array<RippleTransactionDataInfo>> {
        return await this._rippleBlockchain.GetAccountTransactions(account);
    }

    public async GetCurrentFee(): Promise<RippleFee>
    {
        return await this._rippleBlockchain.GetFee();
    }

    public GenerateTransaction(toAccount: string, amount: number, accountNumber: number, selectedFee: string, destinationTag?: number): RippleTransaction
    {
        // Validate accountNumber
        if(accountNumber >= this._accounts.length){
            throw new Error('Account number is wrong');
        }

        // Check balance
        let bal = 0;
        var acc = this._accounts[accountNumber];
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
            sequence: this._accounts[accountNumber].sequence,
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

    public async SendTransaction(tx: RippleSignedTx): Promise<RippleTransactionResponse> {
        return await this._rippleBlockchain.BroadCastTransaction(tx.serialized_tx);
    }
}
