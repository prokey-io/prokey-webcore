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

import { CoinBaseType } from '../coins/CoinInfo';
import { Device } from '../device/Device';
import { RippleCoinInfoModel } from '../models/CoinInfoModel';
import { BaseWallet } from './BaseWallet';
import * as PathUtil from '../utils/pathUtils';
import { AddressModel, RippleAddress, RippleSignedTx, RippleTransaction } from '../models/Prokey';
import { RippleBlockchain } from '../blockchain/RippleBlockchain';
import * as WalletModel from '../models/RippleWalletModel';

var WAValidator = require('multicoin-address-validator');

export class RippleWallet extends BaseWallet {
    // _block_chain : ProkeyRippleBlockchain;
    _rippleBlockchain: RippleBlockchain;
    _rippleWallet: WalletModel.RippleWalletModel;

    constructor(device: Device, coinName: string) {
        super(device, coinName, CoinBaseType.Ripple);

        this._rippleBlockchain = new RippleBlockchain(super.GetCoinInfo());
        this._rippleWallet = {
            totalBalance: 0,
            accounts: new Array<WalletModel.RippleAccountInfo>(),
        };
    }

    /**
     * Start searching blockchain to discovery(find) the wallet
     * @param accountFindCallBack is an optional callback function, this function will be called when an account discovered
     * @returns RippleWallet with all accounts
     */
    public async StartDiscovery(
        accountFindCallBack?: (accountInfo: WalletModel.RippleAccountInfo) => void
    ): Promise<WalletModel.RippleWalletModel> {
        return new Promise<WalletModel.RippleWalletModel>(async (resolve, reject) => {
            let an = 0;
            this._rippleWallet.accounts = new Array<WalletModel.RippleAccountInfo>();
            do {
                //! Get account n info
                let account = await this.GetAccountInfo(an);

                //! If Account is not founded
                if (account.isAccountFounded == false) {
                    //! If there is no account in the wallet, a default account(first account) will be added
                    if (this._rippleWallet.accounts.length == 0) {
                        let emptyAccount: WalletModel.RippleAccountInfo = {
                            Balance: '0',
                            Account: account.addressModel.address,
                            OwnerCount: 0,
                            PreviousTxnId: '',
                            PreviousTxnLgrSeq: 0,
                            Sequence: 0,
                            TickSize: 0,
                            TransferRate: 0,
                            LedgerEntryType: '',
                            Flags: 0,

                            isAccountFounded: false,
                            addressModel: account.addressModel,
                        };

                        if (accountFindCallBack) {
                            accountFindCallBack(emptyAccount);
                        }
                        this._rippleWallet.accounts.push(emptyAccount);
                    }
                    // there is nothing here
                    return resolve(this._rippleWallet);
                } else {
                    this._rippleWallet.accounts.push(account);
                    this._rippleWallet.totalBalance += +account.Balance!;
                    if (accountFindCallBack) {
                        accountFindCallBack(account);
                    }
                    an++;
                }
            } while (true);
        });
    }

    /**
     * Get account's transaction from blockchain
     * @param account
     * @returns
     */
    public async GetAccountTransactions(accountNumber: number): Promise<Array<WalletModel.RippleTransactionDataInfo>> {
        if (this._rippleWallet.accounts == null) {
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        // Validate account
        if (accountNumber >= this._rippleWallet.accounts.length) {
            throw new Error(`Cannot fine account #${accountNumber}`);
        }

        let accountAddress = this._rippleWallet.accounts[accountNumber].Account;

        return await this._rippleBlockchain.GetAccountTransactions(accountAddress);
    }

    public async GetCurrentFee(): Promise<WalletModel.RippleFee> {
        return await this._rippleBlockchain.GetFee();
    }

    public GenerateTransaction(
        toAccount: string,
        amount: number,
        accountNumber: number,
        selectedFee: string,
        destinationTag?: number
    ): RippleTransaction {
        // Validate accountNumber
        if (accountNumber >= this._rippleWallet.accounts!.length) {
            throw new Error('Account number is wrong');
        }

        // Check balance
        let bal = 0;
        var acc = this._rippleWallet.accounts![accountNumber];
        if (acc != null && acc.Balance != null) {
            bal = +acc.Balance;
        }

        let ci = super.GetCoinInfo() as RippleCoinInfoModel;

        bal =
            bal -
            ci.min_balance - // 20 XRP for reserve
            amount -
            +selectedFee;
        if (bal < 0) throw new Error('Insufficient balance you need to hold 20 XRP in your account.');

        let path = PathUtil.GetBipPath(CoinBaseType.Ripple, accountNumber, ci);

        let tx: RippleTransaction = {
            address_n: path.path,
            fee: +selectedFee,
            sequence: this._rippleWallet.accounts![accountNumber].Sequence,
            payment: {
                amount: amount,
                destination: toAccount,
            },
        };
        if (destinationTag) {
            tx.payment.destination_tag = destinationTag;
        }
        return tx;
    }

    public async SendTransaction(tx: RippleSignedTx): Promise<WalletModel.RippleSubmitTransactionResponse> {
        return await this._rippleBlockchain.BroadCastTransaction(tx.serialized_tx);
    }

    /**
     * Validate if this is a valid Ripple address
     * @param address The address to be checked
     */
    public IsAddressValid(address: string): boolean {
        return WAValidator.validate(address, 'xrp');
    }

    // Get ripple account info from blockchain
    private async GetAccountInfo(accountNumber: number): Promise<WalletModel.RippleAccountInfo> {
        let path = PathUtil.GetBipPath(CoinBaseType.Ripple, accountNumber, super.GetCoinInfo());

        let address = await this.GetAddress<RippleAddress>(path.path, false);

        //! Save address

        //! Getting address(account) info. from blockchain
        let reqAdd: AddressModel = { address: address.address, path: path.path };
        let addressInfo = await this._rippleBlockchain.GetAddressInfo(reqAdd);

        //! Add AddressModel
        if (addressInfo != null) {
            addressInfo.addressModel = path;
        }

        return addressInfo;
    }
}
