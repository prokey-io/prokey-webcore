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
import { OmniBlockChain } from '../blockchain/servers/prokey/src/omni/Omni';
import { EnumOutputScriptType, RefTransaction } from '../models/Prokey';
import { BitcoinFeeSelectionModel } from '../models/FeeSelectionModel';
import { BaseWallet } from './BaseWallet';
var WAValidator = require('multicoin-address-validator');
import * as Utility from '../utils/utils';
import { MyConsole } from '../utils/console';
import { OmniCoinInfoModel } from '../models/CoinInfoModel'
import { BitcoinBlockChain } from '../blockchain/servers/prokey/src/bitcoin/Bitcoin';
import { BitcoinTxInfo } from '../models/BitcoinWalletModel';

/**
 * If you wish to discover and use the omni wallet, you need to use this class. 
 * This class can be used for all OmniLayer based coins over Bitcoin blockchain.
 */
export class OmniWallet extends BaseWallet {
    _wallet!: WalletModel.OmniWalletModel;
    _blockchain: OmniBlockChain;

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
        
        this._blockchain = new OmniBlockChain('omni', coinInfo.proparty_id, coinInfo.blockchain || 'BTC');
    }

    /**
     * Start searching blockchain to discovery(find) the wallet
     * @param accountFindCallBack is an optional callback function, this function will be called when an account discovered
     * @param allAccounts true means discover all account, false means discover only the first account
     */
    public async StartDiscovery(accountFindCallBack?: (accountInfo: WalletModel.OmniAccountInfo) => void, allAccounts = false): Promise<WalletModel.OmniWalletModel>{
        this._wallet = {
            totalBalance: 0,
        }

        return new Promise<WalletModel.OmniWalletModel>(async (resolve, reject)=>{
            let an = 0;
            try {

                do
                {
                    // Discover the account number n
                    let account = await this.AccountDiscovery(an);

                    if(this._wallet.accounts == undefined) {
                        this._wallet.accounts = new Array<WalletModel.OmniAccountInfo>();
                    }

                    // update the total wallet balance 
                    this._wallet.totalBalance += account.balance;

                    this._wallet.accounts.push(account);

                    if(accountFindCallBack){
                        accountFindCallBack(account);
                    }

                    // If there is no transaction, the discovery finished
                    if(account.trKeys == null || account.trKeys.length == 0){
                        return resolve(this._wallet);
                    }
                    
                    // go for next account
                    an++;
                
                } while(allAccounts);
            }
            catch(reason) {
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
        }

        const coinInfo = super.GetCoinInfo() as OmniCoinInfoModel;
        
        // Makinging a list of paths
        let path = PathUtil.GetListOfBipPath(
            coinInfo.slip44,                 
            0,                      // Each address is considered as an account
            1,                      // We only need an address
            true,                   // Segwit
            false,                  // No change address
            accountNumber);

        // Getting addresses from Prokey
        let address = await super.GetAddress(path[0].path, false);
        
        // Update the account info address
        accountInfo.addressModel = {
            address: address.address,
            path: path[0].path,
            serializedPath: path[0].serializedPath,
        }

        // Getting address' info
        var addInfo = await this._blockchain.GetAddressInfo(<GenericWalletModel.RequestAddressInfo>{
            address: address.address,      // Address
            addressModel: path[0],
        });

        if(coinInfo.divisible) {
            addInfo.balance *= 100000000;
        }

        accountInfo.balance += (addInfo.balance == null) ? 0 : addInfo.balance;
        accountInfo.trKeys = addInfo.trKeys;

        return accountInfo;
    }

    /**
     * Generate a OmniLayer transaction to be signed by device
     * @param receivers Receiver bitcoin address
     * @param fromAccount Account Number
     * @param selectedFee The prefered fee, can be 'economy', 'normal', 'priority', check @CalculateTransactionFee function
     */
    public async GenerateTransaction(receiverAddress: string, amount: number, fromAccount = 0, selectedFee: string = 'normal'): Promise<BitcoinTx> {
        if(this._wallet.accounts == null){
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        // Validate account
        if(fromAccount >= this._wallet.accounts.length){
            throw new Error(`Cannot fine account #${fromAccount}`);
        }

        // Validate list of receivers
        if(receiverAddress == undefined || receiverAddress.length == 0) {
            throw new Error('Receiver address can not be empty');
        }

        let acc = this._wallet.accounts[fromAccount];

        if(amount > acc.balance) {
            throw new Error('No sufficient balance in your account');
        }

        if(acc.addressModel == null) {
            throw new Error('Address model is undefined');
        }

        const coinInfo = super.GetCoinInfo() as OmniCoinInfoModel;

        // Get UTXO from BTC blockchain
        let addInfo = await this._blockchain.GetBaseCoinAddressInfo(acc.addressModel.address);

        MyConsole.Info("Btc address info", addInfo);

        if(!addInfo) {
            throw new Error('Cannot get BTC address info');
        }

        if(!addInfo.utxOs || addInfo.utxOs.length == 0) {
            throw new Error('No UTXO for this address');
        }

        //! Get the prefered transaction fee
        //! For SECURITY, We must calculate the transaction fee again
        let fees = await this._blockchain.GetTxFee();
        selectedFee = selectedFee.toLowerCase();
        let selectedTxFee = fees.economy;
        if(selectedFee == 'economy' || selectedFee == 'low' || selectedFee == 'minimal' || selectedFee == 'min'){
            selectedTxFee = +fees.economy;
        } else if( selectedFee == 'priority' || selectedFee == 'high' || selectedFee == 'fast' || selectedFee == 'max') {
            selectedTxFee = +fees.high;
        }

        let txLen = this.CalculateTxLen();
        let txFee = selectedTxFee * txLen;

        // Sort UTXO
        let sortedUtoxs = addInfo.utxOs.sort( (a,b) => {
            if (a.amount > b.amount) 
                return -1;
            else if( a.amount == b.amount)
                return 0;
            else
                return 1;
        });

        MyConsole.Info("sortedUtoxs", sortedUtoxs);

        let selectedUtxo = sortedUtoxs.find(utxo => {
            return utxo.amount > (coinInfo.dust_limit + txFee );
        })

        if(!selectedUtxo) {
            throw new Error("No sufficient balance in one UTXO");
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
            prev_hash: selectedUtxo.hash,
            prev_index: selectedUtxo.index,
            amount: selectedUtxo.amount.toString(),
        });

        //! Load previous transactions 
        await this.LoadPrevTx(tx);

        // first address is CHANGE which should be the same as account address
        tx.outputs.push({
            address_n: acc.addressModel.path,
            script_type: EnumOutputScriptType.PAYTOP2SHWITNESS,
            amount: (selectedUtxo.amount - txFee - coinInfo.dust_limit).toString(),
        });

        // Omni Simple send Transaction
        // VVVV = 2 bytes version
        // SSSS = 2 bytes transaction type, 0: Simple Send
        // COINIDEN = 4 bytes, Currency identifier, 1 = OMNI, 2 OMNI test, 3 = MAID, 31 = USDT
        // NUMBER_OF_COINS = 8 bytes
        let omniCoinId = ("00000000" + coinInfo.proparty_id.toString(16)).substr(-8);
        let omniAmount = ("0000000000000000" + amount.toString(16)).substr(-16);
        
        //                                                    omni   VVVVSSSS   COINIDEN     AMOUNT
        let omniProto = Utility.HexStringToByteArrayNumber( `6f6d6e6900000000${omniCoinId}${omniAmount}`);

        tx.outputs.push({
            op_return_data: omniProto,
            amount: '0',
            script_type: EnumOutputScriptType.PAYTOOPRETURN,
        });

        // Receiver
        tx.outputs.push({
            address: receiverAddress,
            script_type: EnumOutputScriptType.PAYTOADDRESS,
            amount: coinInfo.dust_limit.toString(),
        });

        MyConsole.Info("tx:", tx);

        return tx;
    }

    /**
     * This function will return a list of transaction of the account, this function is useful for UI
     * @param accountNumber Account number
     * @param startIndex Transaction start index
     * @param numberOfTransactions Number of transaction
     */
    public async GetTransactionViewList(accountNumber: number = 0, startIndex: number = 0, numberOfTransactions: number ): Promise<Array<WalletModel.OmniTransactionView>>{
        if(this._wallet.accounts == null){
            throw new Error("There is no account in wallet, Do Wallet Discovery First");
        }

        // Validate account
        if(accountNumber >= this._wallet.accounts.length){
            throw new Error(`Cannot fine account #${accountNumber}`);
        }

        // WE ONLY CHECK THE CURRENT ACCOUNT
        const account = this._wallet.accounts[accountNumber];

        let txViewList = Array<WalletModel.OmniTransactionView>();
        
        if(account.trKeys == null || account.trKeys.length == 0){
            return txViewList;
        }

        // Retrive transaction list from server
        let listOfTransactions = await this._blockchain.GetLatestTransactions(account.trKeys, numberOfTransactions, startIndex);

        if(account.addressModel == undefined)
        {
            throw new Error('Address Model can not be undefined');
        }

        // Decimal Factor
        // for divisible coins or tokens, the value in this field is to be divided by 100,000,000
        // for indivisible coins or tokens, the value in this field is the integer number of Omni Protocol coins or tokens (e.g. 1 represents 1 indivisible token)
        const decimalFactor = (super.GetCoinInfo() as OmniCoinInfoModel).divisible ? 100000000 : 1;

        listOfTransactions.forEach(tx => {
            let tv: WalletModel.OmniTransactionView = {
                fromAddress: tx.fromAddress,
                toAddress: tx.toAddress,
                amount: tx.amount * decimalFactor,
                blockId: tx.blockId,
                hash: tx.hash,
                date: new Date(tx.timeStamp * 1000).toLocaleString(),
                status: (account.addressModel == undefined || tx.fromAddress == account.addressModel.address) ? 'SENT' : 'RECEIVED',
                isValid: tx.valid,
                invalidReason: tx.invalidReason,
            };

            txViewList.push(tv);
        });


        return txViewList;
    }

    /**
     * Validating the bitcoin address
     * @param address The address to be checked
     */
    public IsAddressValid(address: string): boolean {
        let coinInfo = this.GetCoinInfo();

        let symbol: string = "bitcoin";
        
        if(coinInfo.test != undefined && coinInfo.test) {
            if(WAValidator.validate(address, symbol, 'testnet')) {
                return true;
            }
        } else {
            if(WAValidator.validate(address, symbol)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * To Send/Broadcast a transaction
     * @param txData Signed transaction to be sent to the network
     */
    public async SendTransaction(txData: string){
        return this._blockchain.BroadCastTransaction(txData);
    }

    /**
     * To calculate the a transaction fee
     */
    public async CalculateTransactionFee(): Promise<BitcoinFeeSelectionModel> {

        let txFees = await this._blockchain.GetTxFee();

        // Calculate transaction length
        let txLen = this.CalculateTxLen();

        let fees: BitcoinFeeSelectionModel = {
            economy: (txLen * txFees.economy).toString(),
            normal: (txLen * txFees.normal).toString(),
            priority: (txLen * txFees.high).toString(),
            unit: 'BTC',
            decimal: 8
        }

        return fees;
    }

    /**
     * Estimate the length of a transaction
     */
    private CalculateTxLen(): number {
        //! We should calculate the size of this transaction to calculate the actual fee
        //     BTC + 1*INP + 3*OUT + DATA + OPRETURN
        return (10 +  148  + 3*180 + 16   + 10);
    }

    /**
     * Loading previous transaction of each input(s).
     * @param tx Bitcoin transaction 
     */
    private async LoadPrevTx(tx: BitcoinTx) {
        if(tx.inputs == undefined || tx.inputs.length == 0){
            throw new Error("Transaction inputs cannot be null or empty")
        }

        let txHashIds = "";
        tx.inputs.forEach(element => {
            txHashIds += "," + element.prev_hash;
        });

        //! Removing the first ','
        txHashIds = txHashIds.substring(1);

        // Load prev. transactions from BTC blockchain
        let prevTxs = await this.GetBtcTransactions(txHashIds);

        if(prevTxs == null || prevTxs.length != tx.inputs.length) {
            throw new Error("PrevTx are not set correctly")
        }

        tx.refTxs = new Array<RefTransaction>();
        const coinInfo = super.GetCoinInfo() as OmniCoinInfoModel;
        
        prevTxs.forEach(prev => {
            let ref: RefTransaction = {
                hash: prev.hash,
                version: prev.version,
                lock_time: prev.lockTime,
                bin_outputs: [],
                inputs: [],
            }

            if(coinInfo.timestamp){
                ref.timestamp = prev.timeStamp;
            }

            prev.inputs.forEach( inp => {
                ref.inputs.push({
                    prev_hash: inp.spentTxHash,
                    prev_index: inp.spentOutputIndex,
                    sequence: inp.sequence,
                    script_sig: inp.scriptHex,
                });
            });

            prev.outputs.forEach( out => {
                ref.bin_outputs.push({
                    amount: out.value,
                    script_pubkey: out.scriptHex,
                })
            });

            if(tx.refTxs){
                tx.refTxs.push(ref);
            }
        });
    }

    /**
     * Get Bitcoin Transaction data which is used for prev. tx info
     * @param hash Hash of transactions
     * @returns Array of BitcoinTxInfo
     */
    private async GetBtcTransactions(hash: string): Promise<Array<BitcoinTxInfo>>{
        const btcBlockchain = new BitcoinBlockChain('BTC');
        return btcBlockchain.GetTransactions(hash);
    }
}