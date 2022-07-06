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

import { CoinBaseType } from '../coins/CoinInfo';
import { Device } from '../device/Device';
import * as PathUtil from '../utils/pathUtils';
import { BitcoinTx } from '../models/BitcoinTx';
import * as WalletModel from '../models/OmniWalletModel';
import * as GenericWalletModel from '../models/GenericWalletModel';
import { EnumOutputScriptType, RefTransaction } from '../models/Prokey';
import { BitcoinFeeSelectionModel } from '../models/FeeSelectionModel';
import { BaseWallet } from './BaseWallet';
var WAValidator = require('multicoin-address-validator');
import * as Utility from '../utils/utils';
import { MyConsole } from '../utils/console';
import { OmniCoinInfoModel } from '../models/CoinInfoModel';
import { BlockchainServerModel, BlockchainProviders } from '../blockchain/BlockchainProviders';
import { BitcoinBlockchain } from '../blockchain/BitcoinBlockchain';

/**
 * If you wish to discover and use the omni wallet, you need to use this class.
 * This class can be used for all OmniLayer based coins over Bitcoin blockchain.
 */
export class OmniWallet extends BaseWallet {
    private _wallet!: WalletModel.OmniWalletModel;
    private _bitcoinBlockchain: BitcoinBlockchain;
    private _servers: BlockchainServerModel[];
    private _propertyId: number;

    _TX_DEFAULT_INPUT_SIZE = 148;
    _TX_DEFAULT_OUTPUT_SIZE = 180;
    _TX_DEFAULT_OVERHEAD_SIZE = 192;

    /**
     *
     * @param device The prokey device instance
     * @param coinName Coin name, Check /data/ProkeyCoinsInfo.json
     */
    constructor(device: Device, coinName: string, propertyId?: number) {
        super(device, coinName, CoinBaseType.OMNI);

        const coinInfo = super.GetCoinInfo() as OmniCoinInfoModel;
        this._propertyId = coinInfo.proparty_id;

        // set the servers
        this._servers = BlockchainProviders.Get(coinInfo);

        // initial the blockchain instance
        this._bitcoinBlockchain = new BitcoinBlockchain(this._servers);
    }

    /**
     * Start searching blockchain to discovery(find) the wallet
     * @param accountFindCallBack is an optional callback function, this function will be called when an account discovered
     * @param allAccounts true means discover all account, false means discover only the first account
     */
    public async StartDiscovery(
        accountFindCallBack?: (accountInfo: WalletModel.OmniAccountInfo) => void,
        allAccounts = true
    ): Promise<WalletModel.OmniWalletModel> {
        this._wallet = {
            totalBalance: 0,
            accounts: [],
        };

        return new Promise<WalletModel.OmniWalletModel>(async (resolve, reject) => {
            let an = 0;
            try {
                do {
                    // Discover the account number n
                    let account = await this.AccountDiscovery(an);

                    if (an > 0 && account.transactions?.length == 0) {
                        return resolve(this._wallet);
                    }

                    // update the total wallet balance
                    this._wallet.totalBalance += account.balance;

                    this._wallet.accounts?.push(account);

                    if (accountFindCallBack) {
                        accountFindCallBack(account);
                    }

                    // go for next account
                    an++;
                } while (allAccounts);
            } catch (reason) {
                reject(reason);
            }
        });
    }

    /**
     * Account Discovery
     * @param accountNumber Account number to be discovered
     */
    public async AccountDiscovery(accountNumber: number = 0): Promise<WalletModel.OmniAccountInfo> {
        let accountInfo: WalletModel.OmniAccountInfo = {
            accountIndex: accountNumber,
            balance: 0,
            transactions: [],
        };

        let path = PathUtil.GetBipPath(
            CoinBaseType.OMNI, // Coin Type
            accountNumber // Account Number
        );

        // Getting addresses from Prokey
        let address = await super.GetAddress(path.path, false);

        // Update the account info address
        accountInfo.addressModel = {
            address: address.address,
            path: path.path,
        };

        // Getting address' info from blockchain
        var addInfo = await this._bitcoinBlockchain.GetAddressInfo(accountInfo.addressModel);

        accountInfo.bitcoinAddressInfo = addInfo;

        // No transaction means no balance
        if (addInfo.txs == 0 || addInfo.transactions == null) {
            return accountInfo;
        }

        // Search for OMNI Layer Transactions
        addInfo.transactions.forEach((tx) => {
            let isOmni = false;
            let isDust = false;
            let receiverAddress = '';
            let pid = 0;
            let value = 0;

            tx.vout.forEach((out) => {
                if (out.isAddress && out.value == '546') {
                    receiverAddress = out.addresses[0];
                    isDust = true;
                }
                // OmniLayer SIMPLE SEND data structure
                // OP_RETURN  LEN   omni    Version  PropertyId  Value
                //    6a      14  6f6d6e69 [4 bytes]  [4 Bytes] [8 byte]
                else if (
                    out.hex && // if hex data is present
                    out.hex.length == 44 && // we have 1 byte for OP_RETURN and 1 byte for len and 20 bytes for data (each byte in string hex format needs two string characters)
                    out.hex?.substring(0, 12).toLocaleLowerCase() == '6a146f6d6e69' // fixed start bytes
                ) {
                    // get propertyId
                    pid = parseInt(out.hex.substring(20, 20 + 8), 16);
                    // if it is same as this wallet propertyId
                    if (pid == this._propertyId) {
                        // get the value
                        value = parseInt(out.hex.substring(28, 28 + 16), 16);
                        isOmni = true;
                    }
                }
            });

            if (isDust && isOmni) {
                // if it's a reveive transaction
                if (receiverAddress == address.address) {
                    accountInfo.balance += value;
                    tx.omniIsReceived = true;
                }
                // if it's a send transaction
                else {
                    accountInfo.balance -= value;
                    tx.omniIsReceived = false;
                }
                tx.omniSenderAddress = tx.vin[0].addresses[0];
                tx.omniReceiverAddress = receiverAddress;
                tx.omniValue = value;
                accountInfo.transactions?.push(tx);
            }
        });

        return accountInfo;
    }

    /**
     * Generate a OmniLayer transaction to be signed by device
     * @param receivers Receiver bitcoin address
     * @param fromAccount Account Number
     * @param selectedFee The prefered fee, can be 'economy', 'normal', 'priority', check @CalculateTransactionFee function
     */
    public async GenerateTransaction(
        receiverAddress: string,
        amount: number,
        fromAccount = 0,
        selectedFee: string = 'normal'
    ): Promise<BitcoinTx> {
        if (this._wallet.accounts == null) {
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        // Validate account
        if (fromAccount >= this._wallet.accounts.length) {
            throw new Error(`Cannot fine account #${fromAccount}`);
        }

        // Validate list of receivers
        if (receiverAddress == undefined || receiverAddress.length == 0) {
            throw new Error('Receiver address can not be empty');
        }

        let acc = this._wallet.accounts[fromAccount];

        if (amount > acc.balance) {
            throw new Error('No sufficient balance in your account');
        }

        if (acc.addressModel == null) {
            throw new Error('Address model is undefined');
        }

        const coinInfo = super.GetCoinInfo() as OmniCoinInfoModel;

        // Get UTXO from BTC blockchain
        let addInfo = await this._bitcoinBlockchain.GetAddressInfo(acc.addressModel);

        MyConsole.Info('Btc address info', addInfo);

        if (!addInfo) {
            throw new Error('Cannot get BTC address info');
        }

        // update UTXO
        await this.UpdateAccountUtxos(acc);

        MyConsole.Info('OmniWallet::GenerateTransaction->sortedUtoxs:', acc.sortedUtxos);

        if (acc.sortedUtxos == null || acc.sortedUtxos.length == 0) {
            throw new Error('UTXO list is empty or undefined');
        }

        //! Get the prefered transaction fee
        //! For SECURITY, We must calculate the transaction fee again
        let fees = await this._bitcoinBlockchain.GetTxFee(true);
        selectedFee = selectedFee.toLowerCase();
        let selectedTxFee = fees.economy;
        if (selectedFee == 'economy' || selectedFee == 'low' || selectedFee == 'minimal' || selectedFee == 'min') {
            selectedTxFee = +fees.economy;
        } else if (
            selectedFee == 'priority' ||
            selectedFee == 'high' ||
            selectedFee == 'fast' ||
            selectedFee == 'max'
        ) {
            selectedTxFee = +fees.high;
        }
        let txLen = this.CalculateTxLen();
        let txFee = selectedTxFee * txLen;

        let selectedUtxo = acc.sortedUtxos.find((utxo) => {
            return +utxo.value > coinInfo.dust_limit + txFee;
        });

        if (!selectedUtxo) {
            throw new Error('No sufficient balance in one UTXO');
        }

        let tx: BitcoinTx = {
            coinName: 'Bitcoin',
            inputs: [],
            outputs: [],
            options: {},
        };

        // Transaction input
        tx.inputs.push({
            address_n: acc.addressModel.path,
            prev_hash: selectedUtxo.txid,
            prev_index: selectedUtxo.vout,
            amount: selectedUtxo.value,
        });

        //! Load previous transactions
        await this.LoadPrevTx(acc, tx);

        // first address is CHANGE which should be the same as account address
        tx.outputs.push({
            address_n: acc.addressModel.path,
            script_type: EnumOutputScriptType.PAYTOP2SHWITNESS,
            amount: (+selectedUtxo.value - txFee - coinInfo.dust_limit).toString(),
        });

        // Omni Simple send Transaction
        // VVVV = 2 bytes version
        // SSSS = 2 bytes transaction type, 0: Simple Send
        // COINIDEN = 4 bytes, Currency identifier, 1 = OMNI, 2 OMNI test, 3 = MAID, 31 = USDT
        // NUMBER_OF_COINS = 8 bytes
        let omniCoinId = ('00000000' + coinInfo.proparty_id.toString(16)).substr(-8);
        let omniAmount = ('0000000000000000' + amount.toString(16)).substr(-16);

        //                                                    omni   VVVVSSSS   COINIDEN     AMOUNT
        let omniProto = Utility.HexStringToByteArrayNumber(`6f6d6e6900000000${omniCoinId}${omniAmount}`);

        tx.outputs.push({
            op_return_data: omniProto,
            amount: '0',
            script_type: EnumOutputScriptType.PAYTOOPRETURN,
        });

        // Receiver
        tx.outputs.push({
            address: receiverAddress,
            script_type: EnumOutputScriptType.PAYTOADDRESS,
            amount: '546', // dust
        });

        MyConsole.Info('OmniWallet::GenerateTransaction->tx to be signed:', tx);

        return tx;
    }

    /**
     * Get account UTXOss
     * @param acc The omni account
     * @returns sorted UTXOs
     */
    public async UpdateAccountUtxos(acc: WalletModel.OmniAccountInfo) {
        let utxos: WalletModel.BitcoinUtxoModel[] = [];
        if (acc.addressModel == null) {
            return utxos;
        }

        utxos = await this._bitcoinBlockchain.GetAddressUtxo(acc.addressModel?.address);

        acc.sortedUtxos = utxos.sort((a, b) => {
            const aValue = +a.value;
            const bValue = +b.value;
            if (aValue > bValue) {
                return -1;
            } else if (aValue == bValue) {
                return 0;
            } else {
                return 1;
            }
        });
    }

    /**
     * This function will return a list of transaction of the account, this function is useful for UI
     * @param accountNumber Account number
     * @param startIndex Transaction start index
     * @param numberOfTransactions Number of transaction
     */
    public async GetTransactionViewList(
        accountNumber: number = 0,
        startIndex: number = 0,
        numberOfTransactions: number
    ): Promise<Array<WalletModel.OmniTransactionView>> {
        if (this._wallet.accounts == null) {
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        // Validate account
        if (accountNumber >= this._wallet.accounts.length) {
            throw new Error(`Cannot find account #${accountNumber}`);
        }

        // WE ONLY CHECK THE CURRENT ACCOUNT
        const account = this._wallet.accounts[accountNumber];

        let txViewList = Array<WalletModel.OmniTransactionView>();

        if (account.transactions == null || account.transactions.length == 0) {
            return txViewList;
        }

        // Retrive transaction list from server
        let listOfTransactions = account.transactions;

        if (account.addressModel == undefined) {
            throw new Error('Address Model can not be undefined');
        }

        listOfTransactions.forEach((tx) => {
            let tv: WalletModel.OmniTransactionView = {
                fromAddress: tx.omniSenderAddress ?? '',
                toAddress: tx.omniReceiverAddress ?? '',
                amount: tx.omniValue ?? 0,
                blockId: tx.blockHeight,
                hash: tx.txid,
                date: new Date(tx.blockTime * 1000).toLocaleString(),
                status: tx.omniIsReceived ? 'RECEIVED' : 'SENT',
                isValid: true,
                invalidReason: '',
            };

            txViewList.push(tv);
        });

        MyConsole.Info('OmniWallet::GetTransactionViewList->Transaction view list', txViewList);

        return txViewList;
    }

    /**
     * Validating the bitcoin address
     * @param address The address to be checked
     */
    public IsAddressValid(address: string): boolean {
        let coinInfo = this.GetCoinInfo();

        let symbol: string = 'bitcoin';

        if (coinInfo.test != undefined && coinInfo.test) {
            if (WAValidator.validate(address, symbol, 'testnet')) {
                return true;
            }
        } else {
            if (WAValidator.validate(address, symbol)) {
                return true;
            }
        }

        return false;
    }

    /**
     * To Send/Broadcast a transaction
     * @param txData Signed transaction to be sent to the network
     */
    public async SendTransaction(txData: string) {
        return this._bitcoinBlockchain.BroadCastTransaction(txData);
    }

    /**
     * To calculate the a transaction fee
     */
    public async CalculateTransactionFee(): Promise<BitcoinFeeSelectionModel> {
        let txFees = await this._bitcoinBlockchain.GetTxFee(true);

        // Calculate transaction length
        let txLen = this.CalculateTxLen();

        let fees: BitcoinFeeSelectionModel = {
            economy: (txLen * txFees.economy).toString(),
            normal: (txLen * txFees.normal).toString(),
            priority: (txLen * txFees.high).toString(),
            unit: 'BTC',
            decimal: 8,
        };

        return fees;
    }

    /**
     * Estimate the length of a transaction
     */
    private CalculateTxLen(): number {
        //! We should calculate the size of this transaction to calculate the actual fee
        //     BTC + 1*INP + 3*OUT + DATA + OPRETURN
        return 10 + 148 + 3 * 180 + 16 + 10;
    }

    /**
     * Loading previous transaction of each input(s).
     * @param tx Bitcoin transaction
     */
    private async LoadPrevTx(acc: WalletModel.OmniAccountInfo, tx: BitcoinTx) {
        if (tx.inputs == undefined || tx.inputs.length == 0) {
            throw new Error('OmniWallet::LoadPrevTx->Transaction inputs cannot be null or empty');
        }

        if (
            acc.bitcoinAddressInfo == null ||
            acc.bitcoinAddressInfo.transactions == null ||
            acc.bitcoinAddressInfo.transactions.length == 0
        ) {
            throw new Error('OmniWallet::No Bitcoin Address info or empty transaction');
        }

        tx.refTxs = new Array<RefTransaction>();
        tx.inputs.forEach((txInput) => {
            let prev = acc.bitcoinAddressInfo?.transactions?.find((t) => t.txid == txInput.prev_hash);
            if (prev == null) {
                throw new Error('OmniWallet::LoadPrevTx->No transaction found for this UTXO');
            }

            let ref: RefTransaction = {
                hash: prev.txid,
                version: prev.version,
                lock_time: prev.lockTime ?? 0,
                bin_outputs: [],
                inputs: [],
            };

            prev.vin.forEach((inp) => {
                if (inp.txid == null) {
                    throw new Error('OmniWallet::LoadPrevTx->PrevTransation id is null');
                }

                if (inp.hex == null) {
                    throw new Error('OmniWallet::LoadPrevTx->PrevTransation hex is null');
                }

                ref.inputs.push({
                    prev_hash: inp.txid,
                    prev_index: inp.vout ?? 0,
                    sequence: inp.sequence,
                    script_sig: inp.hex,
                });
            });

            prev.vout.forEach((out) => {
                if (out.hex == null) {
                    throw new Error('OmniWallet::LoadPrevTx->PrevTransation hex is null');
                }
                ref.bin_outputs.push({
                    amount: out.value,
                    script_pubkey: out.hex,
                });
            });

            if (tx.refTxs) {
                tx.refTxs.push(ref);
            }
        });
    }
}
