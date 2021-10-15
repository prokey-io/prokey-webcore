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

import * as WalletModel from '../models/BitcoinWalletModel';
import * as GenericWalletModel from '../models/GenericWalletModel'
import { CoinBaseType } from '../coins/CoinInfo';
import { BitcoinBaseCoinInfoModel } from '../models/CoinInfoModel';
import { Device } from '../device/Device'
import * as PathUtil from '../utils/pathUtils';
import { BitcoinOutputModel, BitcoinTx } from '../models/BitcoinTx';
import { BitcoinBlockChain } from '../blockchain/servers/prokey/src/bitcoin/Bitcoin';
import { BitcoinFeeSelectionModel } from '../models/FeeSelectionModel';
import {
    RefTransaction,
    TransactionInput,
    TransactionOutput,
    EnumOutputScriptType,
    AddressModel,
} from '../models/Prokey';
import { BaseWallet } from './BaseWallet';
import { MyConsole } from '../utils/console'
var WAValidator = require('multicoin-address-validator');

/**
 * If you wish to discover and use the bitcoin wallet, you need to use this class. 
 * This class can be used for all bitcoin based coins.
 */
export class BitcoinWallet extends BaseWallet {
    private _bitcoinWallet!: WalletModel.BitcoinWalletModel 
    private _blockchain: BitcoinBlockChain;


    // -----------------  Segwit TX -----------------------
    // Input
    // HASH(32) + Index(4) + ScriptLen(1) + Script (~23) + Seq.(4) + Witness(~74) + PK(1+33)
    _TX_DEFAULT_INPUT_SIZE = 172;

    // Output
    // Value(8) + ScriptLen(1) + Script(~23)
    _TX_DEFAULT_OUTPUT_SIZE = 32;

    // TX Details
    // Version(4) + Marker(1) + Flag(1) + InputCout(usually 1B) + OutputCount(usually 1B) + LockTime(4)        
    _TX_DEFAULT_OVERHEAD_SIZE = 12;

    /**
     * class constructor
     * @param device Prokey device instance
     * @param coinName Coin name, Check /data/ProkeyCoinsInfo.json
     */
    constructor(device: Device, coinName: string) {
        super(device, coinName, CoinBaseType.BitcoinBase);

        // Initial Bitcoin Blockchain
        this._blockchain = new BitcoinBlockChain(super.GetCoinInfo().shortcut);
    }

    /**
     * Start searching blockchain to discovery(find) the wallet
     * @param accountFindCallBack is an optional callback function, this function will be called when an account discovered
     * @param allAccounts true means discover all account, false means discover only the first account
     * @returns BitcoinWallet with all accounts 
     */
    public async StartDiscovery(accountFindCallBack?: (accountInfo: WalletModel.BitcoinAccountInfo) => void, allAccounts = false): Promise<WalletModel.BitcoinWalletModel>{
        this._bitcoinWallet = {
            totalBalance: 0,
        }

        this._bitcoinWallet.accounts = new Array<WalletModel.BitcoinAccountInfo>();

        return new Promise<WalletModel.BitcoinWalletModel>(async (resolve, reject) => {
            try {

                let accountNumber = 0;
                let isFinished = false;

                do {
                    // Get account info from blockchain
                    let account = await this.AccountDiscovery(accountNumber);

                    // Add balance
                    this._bitcoinWallet.totalBalance += account.balance;

                    // pust to list of wallet accounts
                    if(this._bitcoinWallet.accounts)
                        this._bitcoinWallet.accounts.push(account);

                    // Calling callback to update the UI
                    if(accountFindCallBack) {
                        accountFindCallBack(account);
                    }

                    // If addresses is more than 20, it means there was at least a transaction in last account
                    // So need to go for next account
                    if(allAccounts && account.addresses.length > 20) {
                        accountNumber++;
                        isFinished = false;
                    } else {
                        isFinished = true;
                    }
                } while(isFinished == false)

                resolve(this._bitcoinWallet);
            }
            catch(e){
                reject(e);
            }
        });
    }

    /**
     * Get last discovered wallet
     * @returns the last discovered wallet
     */
    public GetWallet(): WalletModel.BitcoinWalletModel {
        return this._bitcoinWallet;
    }

    /**
     * Get blockchain 
     */
    public GetBlockChain(): BitcoinBlockChain {
        return this._blockchain;
    }

    /**
     * Discovery change addresses
     * @param accountNumber Account Number
     * @param accountInfo account info which were discovered by AccountDiscovert
     */
    async DiscoverChanges(accountNumber: number, 
        accountInfo: WalletModel.BitcoinAccountInfo)
    {
        var finished: boolean = false;
        var startIndex: number = 0;

        const coinInfo = super.GetCoinInfo() as BitcoinBaseCoinInfoModel;

        do {
            // Makinging a list of paths
            let paths = PathUtil.GetListOfBipPath(coinInfo.slip44, accountNumber, 20, coinInfo.segwit, true, startIndex);
            var justPaths = paths.map(a =>{
                return a.path;
            });

            // Getting addresses from Prokey
            let addresses = await super.GetAddresses<AddressModel>(justPaths);

            // Creating request parameter 
            let reqAddInfo: Array<GenericWalletModel.RequestAddressInfo> = addresses.map(a => {
                return {
                    address: a.address,
                    addressModel: a,
                }
            });

            // Getting addresses' info from Blockchain
            var addInfo = await this._blockchain.GetAddressInfo(reqAddInfo);

            addInfo.forEach(af => {
                accountInfo.balance += af.balance;
                accountInfo.changeAddresses.push(af);
                // If there is any transaction for addresses, we have to search for next (20) addresses again
                // This process will be finished when there is no transaction
                if(!af.exist) {
                    finished = true;
                }
            });

            startIndex+=20;

        } while(!finished);
    }

    /**
     * Account Discovery
     * @param accountNumber account number to be discovered
     */
    public async AccountDiscovery(accountNumber: number = 0): Promise<WalletModel.BitcoinAccountInfo> {
        let accountInfo: WalletModel.BitcoinAccountInfo = {
            accountIndex: accountNumber,
            balance: 0,
            isDiscoveryFinished: true,
            addresses: new Array<WalletModel.BitcoinAddressInfo>(),
            changeAddresses: new Array<WalletModel.BitcoinAddressInfo>(),
        }

        let startIndex = 0;

        const coinInfo = super.GetCoinInfo() as BitcoinBaseCoinInfoModel;

        do {  
            // Makinging a list of paths
            let paths = PathUtil.GetListOfBipPath(coinInfo.slip44, accountNumber, 20, coinInfo.segwit, false, startIndex);
            var justPaths = paths.map(a =>{
                return a.path;
            });

            // Getting addresses from Prokey
            let addresses = await super.GetAddresses<AddressModel>(justPaths);

            // Creating request parameter
            let blockchainReqAddInfo: Array<GenericWalletModel.RequestAddressInfo> = new Array<GenericWalletModel.RequestAddressInfo>();
            addresses.forEach(element => {
                blockchainReqAddInfo.push(
                    {
                        address: element.address,
                        addressModel: element,
                    });
            });

            // Getting addresses' info
            var addInfo = await this._blockchain.GetAddressInfo(blockchainReqAddInfo);

            MyConsole.Info("AddInfo:", addInfo);

            // We assume that account discovery is finished
            accountInfo.isDiscoveryFinished = true;

            addInfo.forEach(af => {
                accountInfo.balance += af.balance;
                accountInfo.addresses.push(af);

                // Set the last used address
                if(accountInfo.lastUnusedAddress == undefined && af.exist == false)
                {
                    accountInfo.lastUnusedAddress = af.addressModel;
                }

                // If last unused address already set but we found an exist address after that, It might be not the LAST unused address
                // LastUnusedAddress will be update on next adresses
                if(accountInfo.lastUnusedAddress != null && af.exist == true){
                    accountInfo.lastUnusedAddress = undefined;
                }
                
                // If there is any transaction for addresses, we have to search for next (20) addresses again
                // This process will be finished when there is no transaction
                if(af.exist){
                    accountInfo.isDiscoveryFinished = false;
                }
            });

            if (!accountInfo.isDiscoveryFinished && startIndex == 0)
            {
                // check for change addresses
                await this.DiscoverChanges(accountNumber, accountInfo);
            }
            startIndex+=20;

        } while(!accountInfo.isDiscoveryFinished);

        return accountInfo;
    }

    /**
     * This function will return a list of transaction of the account, this function is useful for UI
     * @param accountNumber Account number
     * @param startIndex Transaction start index
     * @param numberOfTransactions Number of transaction
     */
    public async GetTransactionViewList(accountNumber: number = 0, startIndex: number = 0, numberOfTransactions: number ): Promise<Array<WalletModel.BitcoinTransactionView>>{

        if(this._bitcoinWallet.accounts == null){
            throw new Error("There is no account in wallet, Do Wallet Discovery First");
        }

        // Validate account
        if(accountNumber >= this._bitcoinWallet.accounts.length){
            throw new Error(`Cannot fine account #${accountNumber}`);
        }

        // WE ONLY CHECK THE CURRENT DISCOVERED ACCOUNT
        const account = this._bitcoinWallet.accounts[accountNumber];

        // Retrive transaction list from server
        let listOfTransactions = await this._blockchain.GetLatestTransactions(account.addresses, numberOfTransactions, startIndex);

        let txViewList = new Array<WalletModel.BitcoinTransactionView>();

        if(listOfTransactions == undefined || listOfTransactions.length == 0){
            return txViewList;
        }

        // For every transaction received from the blockchain
        // These transaction can be either 'send' or 'receive'
        // If any of account addresses appeares on any outputs, this is a 'receive' tx
        // On the other hand, if any of account addresses appeares on any inputs, this is 'send' tx 
        listOfTransactions.forEach(tx => {
            let totalReceived = 0;
            let totalSent = 0;

            let received = Array<WalletModel.BitcoinReceivedView>();

            let isOmni = false;
            // Check if any of the wallet addresses is available in TX outputs which means the address received fund.
            for(let i=0;i<tx.outputs.length; i++) {
                totalReceived += tx.outputs[i].valueNumber;

                // To ignore the warning: this._bitcoinWallet.Accounts is possibly undefined
                if(this._bitcoinWallet.accounts == undefined)
                    break;

                // Check if any of the wallet addresses is in output list of transaction
                // Theoretically, Transaction's output can be contained more than one wallet address
                // So, for each address, we may need to add a receive record
                const addressInOutputs = account.addresses.find(element => element.address == tx.outputs[i].address);

                if(addressInOutputs != undefined) {
                    let isFromOwnWallet = false;
                    let isOpReturn = false;

                    //! Check if it's OMNI
                    for(let j = 0; j<tx.outputs.length; j++) {
                        if(tx.outputs[j].script && tx.outputs[j].script.includes("OP_RETURN")) {
                            isOpReturn = true;
                            break;
                        }
                    }

                    // If this is from OWN wallet addresses?
                    for(let k=0; k<tx.inputs.length; k++) {
                        if(account.addresses.find(walletAddress => walletAddress.address == tx.inputs[k].address)) {
                            isFromOwnWallet = true;
                            break;
                        }
                        
                        if(account.changeAddresses.find(changeAddress => changeAddress.address == tx.inputs[k].address)){
                            isFromOwnWallet = true;
                            break;
                        }
                    }

                    let status : 'RECEIVED' | 'RECEIVED_FROM_OWN' | 'OMNI_RECEIVED' | 'OMNI_CHANGE' = 'RECEIVED';
                    
                    if(isOpReturn) {
                        if(tx.outputs[i].valueNumber == 546) {
                            status = 'OMNI_RECEIVED';
                            isOmni = true;
                        } else if(isFromOwnWallet) {
                            status = 'OMNI_CHANGE';
                            isOmni = true;
                        }
                    } else {
                        status = (isFromOwnWallet) ? 'RECEIVED_FROM_OWN' : 'RECEIVED';
                    }


                    received.push({
                       address: addressInOutputs.address,
                       status:  status,
                       value: tx.outputs[i].valueNumber,
                    });
                }
            }

            // Add received transactions if any
            if(received.length > 0){
                txViewList.push({
                    hash: tx.hash,
                    blockNumber: tx.blockNumber,
                    date: new Date(tx.timeStamp * 1000).toDateString(),
                    received: received,
                    isOmni: isOmni,
                });
            }

            for(let i=0; i < tx.inputs.length; i++) {
                totalSent += tx.inputs[i].valueNumber;
            }

            let sent = new Array<WalletModel.BitcoinSentView>();

            // Check if any of the wallet addresses is available in TX inputs which means the address sent fund.
            for(let i=0; i < tx.inputs.length; i++) {

                // To ignore the warning: this._bitcoinWallet.Accounts is possibly undefined
                if(this._bitcoinWallet.accounts == undefined)
                    break;

                // Find if there is any wallet address in this transaction's input
                let addressInInputs = account.addresses.find(aa => aa.address == tx.inputs[i].address);
                if(addressInInputs == undefined) {
                    addressInInputs = account.changeAddresses.find(ca => ca.address == tx.inputs[i].address);
                }
                
                if(addressInInputs != undefined) {

                    //! If there is any OP_RETURN output
                    let isOpReturn = false;
                    //! If there is any Dust value in outputs
                    let isDust = false;

                    //! Check if there is a OP_RETURN 
                    for(let k = 0; k<tx.outputs.length; k++) {
                        if(tx.outputs[k].script && tx.outputs[k].script.includes("OP_RETURN")) {
                            isOpReturn = true;
                        }

                        if(tx.outputs[k].valueNumber == 546) {
                            isDust = true;
                        }
                    }

                    if(isOpReturn && isDust) {
                        isOmni = true;
                    }

                    // To check how much we sent, we need to check the outputs
                    for( let j=0; j < tx.outputs.length; j++ ) {
                        // If this output is a Change(because the value is returned to our wallet again), ignore it.
                        if(account.changeAddresses.find(aa => aa.address == tx.outputs[j].address)) {
                            continue;
                        }

                        // To own address, Possibly OMNI
                        if(account.addresses.find(aa => aa.address == tx.outputs[j].address)){
                            sent.push({
                                address: tx.outputs[j].address,
                                value: tx.outputs[j].valueNumber,
                                status: (isDust && isOpReturn) ? ((tx.outputs[j].valueNumber == 546) ? 'OMNI_SENT' : 'OMNI_CHANGE') : 'SENT_TO_OWN',
                            });

                            continue;
                        }

                        //! Ignore OP_RETURN VALUE 0 TX
                        if(isOpReturn && tx.outputs[j].valueNumber == 0) {
                            continue;
                        }

                        sent.push({
                            address: tx.outputs[j].address,
                            status: (isOpReturn && tx.outputs[j].valueNumber == 546) ? 'OMNI_SENT' : 'SENT',
                            value: tx.outputs[j].valueNumber,
                        });
                    }

                    // No need to check the other inputs
                    break;
                }
            }

            if(sent.length > 0){
                txViewList.push({
                    hash: tx.hash,
                    blockNumber: tx.blockNumber,
                    sent: sent,
                    date: new Date(tx.timeStamp * 1000).toDateString(),
                    fee: totalSent - totalReceived,
                    isOmni: isOmni,
                })
            }
        });

        MyConsole.Info(txViewList);

        return txViewList;
    }

    /**
     * Generate a bitcoin transaction to be signed by device
     * @param receivers List of receivers
     * @param fromAccount Account Number
     * @param selectedFee The prefered fee, can be 'economy', 'normal', 'priority', check @CalculateTransactionFee function
     */
    public async GenerateTransaction(receivers: Array<BitcoinOutputModel>, fromAccount = 0, selectedFee: string = 'normal'): Promise<BitcoinTx> {
        if(this._bitcoinWallet.accounts == null){
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        // Validate account
        if(fromAccount >= this._bitcoinWallet.accounts.length){
            throw new Error(`Cannot fine account #${fromAccount}`);
        }

        // Validate list of receivers
        if(receivers == undefined || receivers.length == 0) {
            throw new Error('The list of receivers can not be empty');
        }

        const coinInfo = super.GetCoinInfo() as BitcoinBaseCoinInfoModel;

        //! Zcash and Komodo has OverWintered
        const isOverWintered = (coinInfo.shortcut == "ZEC" || coinInfo.shortcut == "KMD");

        //! selected account to send from
        let acc = this._bitcoinWallet.accounts[fromAccount];

        //! Get the prefered transaction fee
        //! For SECURITY, We must calculate the transaction fee again
        let fees = await this.CalculateTransactionFee(receivers, fromAccount);
        selectedFee = selectedFee.toLowerCase();
        let txFee = +fees.normal;
        if(selectedFee == 'economy' || selectedFee == 'low' || selectedFee == 'minimal' || selectedFee == 'min'){
            txFee = +fees.economy;
        } else if( selectedFee == 'priority' || selectedFee == 'high' || selectedFee == 'fast' || selectedFee == 'max') {
            txFee = +fees.priority;
        }
        
        let totalSend = 0;
        receivers.forEach(element => {
            totalSend += element.value;
        });


        //! Total sent should be more than coin dust limit
        if(totalSend < coinInfo.dust_limit){
            throw new Error(`Total value is less that this coin dust limit`);
        }

        //! sufficient balance?
        if((totalSend+txFee) > acc.balance){
            throw new Error("No sufficient balance in your account");
        }

        //! Transaction instance
        let tx: BitcoinTx = {
            coinName: coinInfo.on_device,
            inputs: new Array<TransactionInput>(),
            outputs: new Array<TransactionOutput>(),
            options: {},
        }

        if(isOverWintered) {
            tx.options.overwintered = true;
            tx.options.version = 4;
            tx.options.version_group_id = 0x892f2085;
            if(coinInfo.shortcut == "ZEC"){
                tx.options.branch_id = 3925833126;
            }
        }

        //! Create list of account UTXO
        let sortedUtoxs = this.CreateSortedUtxoList(acc);

        MyConsole.Info("BitcoinWallet::GenerateTransaction->sortedUtoxs:", sortedUtoxs);

        //! Input addresses
        let utxoBal = 0;
        
        // Check if we can handle this transaction only with one Input
        if (sortedUtoxs[0][0].amount >= totalSend + txFee)
        {
            let i = 1;
            for (; i < sortedUtoxs.length; i++) {
                if (sortedUtoxs[i][0].amount < totalSend + txFee)               
                    break;
            }
            // i is the best utxo for input
            let utxo = sortedUtoxs[i - 1];
            if (utxo[1] as number[]) {            
                tx.inputs.push({
                    address_n: (utxo[1] as number[]), 
                    prev_hash: utxo[0].hash, 
                    prev_index: utxo[0].index,
                    amount: utxo[0].amount.toString()
                });            
                utxoBal = utxo[0].amount;
            }
        }
        else
        {
            // We need multi input to handle this transaction            
            for (let i = 0; i < sortedUtoxs.length; i++) {
                let utxo = sortedUtoxs[i];
                if (utxo[1] as number[]) {            
                    tx.inputs.push({address_n: (utxo[1] as number[]), 
                        prev_hash: utxo[0].hash, 
                        prev_index: utxo[0].index,
                        amount: utxo[0].amount.toString()
                    });            
                    utxoBal += utxo[0].amount;
                }    
                if (utxoBal >= totalSend + txFee)
                    break;
            }
        }

        //! Load previous transactions 
        await this.LoadPrevTx(tx, coinInfo.timestamp);

        //! Set the TX's outputs
        receivers.forEach(o => {
            let output: TransactionOutput = {
                address: o.Address,
                script_type: EnumOutputScriptType.PAYTOADDRESS,
                amount: o.value.toFixed(0),
            }

            tx.outputs.push(output);
        });

        //! Getting change address
        let changeIndex = 0;
        for (let i = 0; i < acc.changeAddresses.length; i++)
        {
            if (!acc.changeAddresses[i].exist)
            {
                changeIndex = i;
                break;
            }
            changeIndex = i + 1;
        }

        //! Add change - fee
        let change = utxoBal - totalSend - txFee;        

        let changePaths = PathUtil.GetListOfBipPath(coinInfo.slip44, fromAccount, 1, coinInfo.segwit, true, changeIndex);

        //! No change if the change is less than dust
        if(coinInfo.dust_limit != null)
        {
            if(change >= coinInfo.dust_limit) { 
                tx.outputs.push({
                    address_n: changePaths[0].path,
                    amount: change.toFixed(0),
                    script_type: (coinInfo.segwit) ? EnumOutputScriptType.PAYTOP2SHWITNESS : EnumOutputScriptType.PAYTOADDRESS,
                });
            }
        }
        else if (change > 0) {
            tx.outputs.push({
                address_n: changePaths[0].path,
                amount: change.toFixed(0),
                script_type: (coinInfo.segwit) ? EnumOutputScriptType.PAYTOP2SHWITNESS : EnumOutputScriptType.PAYTOADDRESS,
            });
        }

        MyConsole.Info("BitcoinWallet::GenerateTransaction->Generated transaction to be signed", tx);

        return tx;
    }

    /**
     * Send/Broadcast a signed transaction
     * @param txData Signed Transaction to be sent to the network
     */
    public async SendTransaction(txData: string){
        return this._blockchain.BroadCastTransaction(txData);
    }

    /**
     * To calculate the TX fee
     * @param receivers List of receivers (outputs)
     * @param fromAccount The account number you wish to send from
     */
    public async CalculateTransactionFee(receivers: Array<BitcoinOutputModel>, fromAccount: number ): Promise<BitcoinFeeSelectionModel> {

        if(this._bitcoinWallet.accounts == null){
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        // Validate account
        if(fromAccount >= this._bitcoinWallet.accounts.length){
            throw new Error(`Cannot find account #${fromAccount}`);
        }

        // Validate list of receivers
        if(receivers == undefined || receivers.length == 0) {
            throw new Error('The list of receivers can not be empty');
        }

        const coinInfo = this.GetCoinInfo() as BitcoinBaseCoinInfoModel;

        //! Fixed fees
        if(super.GetCoinInfo().name == "Dogecoin") {
            return <BitcoinFeeSelectionModel>{
                economy: "100000000",
                normal: "100000000",
                priority: "100000000",
                decimal: coinInfo.decimals,
                unit: coinInfo.shortcut,
            }
        }

        // Account
        let acc = this._bitcoinWallet.accounts[fromAccount];

        // Get the current fees from blockchain
        let txFees = await this._blockchain.GetTxFee();

        // Calculate transaction length
        let txLen = this.CalculateTxLen(receivers, acc, txFees);

        let fees: BitcoinFeeSelectionModel = {
            economy: (txLen * txFees.economy).toString(),
            normal: (txLen * txFees.normal).toString(),
            priority: (txLen * txFees.high).toString(),
            unit: coinInfo.shortcut,
            decimal: coinInfo.decimals,
        }

        MyConsole.Info("BitcoinWallet::CalculateTransactionFee->Tx fees", fees);

        return fees;
    }

    /**
     * Estimate the length of a transaction
     * @param receivers List of receivers (outputs)
     * @param acc The account number you wish to send from
     * @param txFees The current fee rated 
     */
    public CalculateTxLen(receivers: Array<BitcoinOutputModel>, acc: WalletModel.BitcoinAccountInfo, txFees: WalletModel.BitcoinFee): number {
        if(this._bitcoinWallet.accounts == null){
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        /*
            s = 10 + 148×n + 34×t, ±n

            where n is the number of inputs and t is the number of outputs. The input contribution accounts for outpoint (36 bytes) script length (1 byte),
            script (107 bytes), and sequence (4 bytes). The output contribution accounts for the value field (8 bytes), script length (1 byte), 
            and script (25 bytes).

            For example, a one-input, one-output transaction would require on average 193 bytes (10 + 148 + 35). 
            A more realistic one-input, two-output transaction that allowed the collection of change would require on average 226 bytes (10 + 148 + 2×34). 
            A six-input, six-output CoinJoin transaction would require on average 1,102 bytes (10 + 6×148 + 6×34), and so on.
        */
        //! We should calculate the size of this transaction to calculate the actual fee
        let txLen = this._TX_DEFAULT_OVERHEAD_SIZE;
        receivers.forEach(receivers => {
           // OPRETURN transaction
           if(receivers.data != undefined) {
               // OPRETURN + Data Lenght
               txLen += 1 + receivers.data.length;
           }
           else {
               txLen += this._TX_DEFAULT_OUTPUT_SIZE;
           }
        });

        //! we may have at least one change address
        txLen += this._TX_DEFAULT_OUTPUT_SIZE;

        //! Create list of account UTXO
        let sortedUtoxs = this.CreateSortedUtxoList(acc);
        if(sortedUtoxs.length == 0) {
            MyConsole.Info("No UTXO");
            //! Bitcoin based transactions has 1 input at least
            return txLen + this._TX_DEFAULT_INPUT_SIZE;
        }

        MyConsole.Info("Sorted UTXO", sortedUtoxs);

        //! Input addresses
        let utxoBal = 0;
        let totalSend = 0;
        receivers.forEach(element => {
            totalSend += element.value;
        });

        // Check if we can handle this transaction only with one Input
        if (sortedUtoxs[0][0].amount >= totalSend + (txFees.economy * (txLen + this._TX_DEFAULT_INPUT_SIZE)))
        {
            let i = 1;
            for (; i < sortedUtoxs.length; i++) {
                if (sortedUtoxs[i][0].amount < totalSend + (txFees.economy * (txLen + this._TX_DEFAULT_INPUT_SIZE)))               
                    break;
            }
            // i is the best utxo for input
            let utxo = sortedUtoxs[i - 1];
            if (utxo[1] as number[]) {            
                txLen += this._TX_DEFAULT_INPUT_SIZE;
            }
        }
        else
        {
           // We need multi input to handle this transaction            
           for (let i = 0; i < sortedUtoxs.length; i++) {
               let utxo = sortedUtoxs[i];
               if (utxo[1] as number[]) {            
                   txLen += this._TX_DEFAULT_INPUT_SIZE;
                   utxoBal += utxo[0].amount;
               }    

               if (utxoBal >= totalSend + (txFees.economy * txLen))
                   break;
           }
        }

        return txLen;
    }

    /**
     * Validating Bitcoin/Litecoin/BitcoinGold and etc addresses
     * @param address The address to be checked
     */
    public IsAddressValid(address: string): boolean {
        let coinInfo = this.GetCoinInfo();

        let symbol: string = coinInfo.shortcut;
        if(symbol == "TEST") {
            symbol = "tBTC";
        }

        if(coinInfo.test != undefined && coinInfo.test == true){
            if(symbol.substr(0,1) == 't'){
                symbol = symbol.substring(1);
            }
        }

        if(!WAValidator.findCurrency(symbol)){
            return false;
        }
        
        if(coinInfo.test != undefined && coinInfo.test == true) {
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
     * Get List of sorted UTXO account
     * @param acc account to get UTXO from  
     */
    private CreateSortedUtxoList(acc: WalletModel.BitcoinAccountInfo): Array<[WalletModel.BitcoinUtxo, Array<number> | string | undefined]>{
        //! Create a utxos list
       var utxos = new Array<[WalletModel.BitcoinUtxo, Array<number> | string | undefined]>();
       acc.addresses.forEach(element => {
           let path = (element.addressModel == undefined) ? undefined : element.addressModel.path;
           if (element.exist && element.txInfo != undefined && element.txInfo.utxOs)
               element.txInfo.utxOs.forEach(utxo => {                    
                   utxos.push([utxo, path]);
               });
       });

       acc.changeAddresses.forEach(element => {
           let path = (element.addressModel == undefined) ? undefined : element.addressModel.path;
           if (element.exist && element.txInfo != undefined && element.txInfo.utxOs)
               element.txInfo.utxOs.forEach(utxo => {
                   utxos.push([utxo, path]);
               });
       });

       let sortedUtoxs = utxos.sort( (a,b) => {
           if (a[0].amount > b[0].amount) 
               return -1;
           else if( a[0].amount == b[0].amount)
               return 0;
           else
               return 1;
       });

       return sortedUtoxs;
    }

    /**
     * Loading previous transaction of each input(s).
     * @param tx Bitcoin transaction 
     */
    private async LoadPrevTx(tx: BitcoinTx, timestamp: boolean) {
        if(tx.inputs == undefined || tx.inputs.length == 0){
            throw new Error("Transaction inputs cannot be null or empty")
        }

        tx.refTxs = new Array<RefTransaction>();
        let n = tx.inputs.length;
        let i = 0;
        while(n > 0)
        {
            let txHashIds = "";
            let perRequest = (n > 10) ? 10 : n;
            
            for(let j=0; j<perRequest; j++)
            {
                txHashIds += "," + tx.inputs[i++].prev_hash;
                n--;
            }

            //! Removing the first ','
            txHashIds = txHashIds.substring(1);

            let prevTxs = await this._blockchain.GetTransactions(txHashIds);

            if(prevTxs == null || prevTxs.length != perRequest) {
                throw new Error("PrevTx are not set correctly")
            }

            prevTxs.forEach(prev => {
                let ref: RefTransaction = {
                    hash: prev.hash,
                    version: prev.version,
                    lock_time: prev.lockTime,
                    bin_outputs: [],
                    inputs: [],
                }

                if(timestamp == true){
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
    }
}

