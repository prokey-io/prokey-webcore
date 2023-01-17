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
import { BitcoinFeeSelectionModel } from '../models/FeeSelectionModel';
import {
    RefTransaction,
    TransactionInput,
    TransactionOutput,
    EnumOutputScriptType,
    AddressModel,
    PublicKey,
} from '../models/Prokey';
import { BaseWallet } from './BaseWallet';
import { MyConsole } from '../utils/console'
import { BlockchainServerModel, BlockchainProviders } from '../blockchain/BlockchainProviders';
import { BitcoinBlockchain } from '../blockchain/BitcoinBlockchain';
var WAValidator = require('multicoin-address-validator');

/**
 * If you wish to discover and use the bitcoin wallet, you need to use this class. 
 * This class can be used for all bitcoin based coins.
 */
export class BitcoinWallet extends BaseWallet {
    private _bitcoinWallet!: WalletModel.BitcoinWalletModel 
    private _bitcoinBlockchain: BitcoinBlockchain;
    private _servers: BlockchainServerModel[];



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

        this._servers = BlockchainProviders.Get(super.GetCoinInfo());
        this._bitcoinBlockchain = new BitcoinBlockchain(this._servers);
    }

    /**
     * Start searching blockchain to discovery(find) the wallet
     * @param accountFindCallBack is an optional callback function, this function will be called when an account discovered
     * @param allAccounts true means discover all account, false means discover only the first account
     * @returns BitcoinWallet with all accounts 
     */
    public async StartDiscovery(accountFindCallBack?: (accountInfo: WalletModel.BitcoinAccountInfo) => void, allAccounts = true): Promise<WalletModel.BitcoinWalletModel>{
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
                    let account: WalletModel.BitcoinAccountInfo;
                    
                    if(this._servers.some(s => s.isSupportXpub == true))
                        account = await this.AccountDiscoveryByPublicKey(accountNumber);
                    else
                        account = await this.AccountDiscoveryByAddresses(accountNumber);

                    // Don't add empty account to list of accounts
                    if(accountNumber > 0 && account.txs == 0) {
                        return resolve(this._bitcoinWallet);
                    }
                    
                    // set account index
                    account.accountIndex = accountNumber;

                    // Add balance
                    this._bitcoinWallet.totalBalance += +account.balance;

                    // pust to list of wallet accounts
                    if(this._bitcoinWallet.accounts) {
                        this._bitcoinWallet.accounts.push(account);
                    }

                    // Calling callback to update the UI
                    if(accountFindCallBack) {
                        accountFindCallBack(account);
                    }

                    // if there is any transaction, this wallet could have another account
                    if(allAccounts && account.txs > 0) {
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
    public GetBlockChain(): BitcoinBlockchain {
        return this._bitcoinBlockchain;
    }

    public async GetAccountPublicKey(accountNumber: number): Promise<AddressModel> {
        // account path
        const path = PathUtil.GetBipPath(
            CoinBaseType.BitcoinBase,   // Coin Type
            accountNumber,              // Account Number
            super.GetCoinInfo(),        // CoinInfo
        );

        // Get publickey from device
        const publicKey: PublicKey = await super.GetPublicKey(path.path, false);

        return {
            address: publicKey.xpub,
            path: path.path,
        }
    }

    /**
     * 
     * @param accountNumber 
     * @returns 
     */
    public async AccountDiscoveryByPublicKey(accountNumber: number = 0): Promise<WalletModel.BitcoinAccountInfo> {
        // Get account public ket
        const publicKey = await this.GetAccountPublicKey(accountNumber);

        // Get account info from blockchain
        const accInfo = await this._bitcoinBlockchain.GetAccountInfoByPublicKey(publicKey.address);

        // Save the account public and its path
        accInfo.publicKey = publicKey;

        // Set last unused address
        if(accInfo.addresses && accInfo.addresses.length > 0) {
            let lastAddressPath = accInfo.addresses[accInfo.addresses.length - 1].path;
            if(lastAddressPath.length == 5)
            {
                // next address
                lastAddressPath[4]++;
                const add = await this.GetAddress(lastAddressPath, false);
                accInfo.lastUnusedAddress = {
                    address: add.address,
                    path: lastAddressPath,
                }
            }
        } else {
            // Get the first address path
            const firstAddressPath = PathUtil.GetBipPath(
                CoinBaseType.BitcoinBase,   // Coin Type
                accountNumber,              // Account Number
                super.GetCoinInfo(),        // CoinInfo
                false,                      // No Change
                0                           // First Address
            );

            // get address from device
            const add = await this.GetAddress(firstAddressPath.path, false);

            // set the last unused address
            accInfo.lastUnusedAddress = {
                address: add.address,
                path: firstAddressPath.path,
            }
        }

        MyConsole.Info("BitcoinWallet::AccountDiscoveryByPublicKey->Account info:", accInfo);

        return accInfo;
    }

    public async AccountDiscoveryByAddresses(accountNumber: number = 0): Promise<WalletModel.BitcoinAccountInfo> {
        return <WalletModel.BitcoinAccountInfo>{};
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
        //let listOfTransactions = await this._blockchain.GetLatestTransactions(account.addresses, numberOfTransactions, startIndex);

        let txViewList = new Array<WalletModel.BitcoinTransactionView>();

        //TODO: if account.transactions == undefined, we can get transaction using API
        if(account.transactions == undefined){
            return txViewList;
        }

        if(account.transactions.length == 0) {
            return txViewList;
        }

        // For every transaction received from the blockchain
        // These transaction can be either 'send' or 'receive'
        // If any of account addresses appeares on any outputs, this is a 'receive' tx
        // On the other hand, if any of account addresses appeares on any inputs, this is 'send' tx 
        account.transactions.forEach(tx => {
            let received = Array<WalletModel.BitcoinReceivedView>();

            let isOmni = false;
            // Check if any of the wallet addresses is available in TX outputs which means the address received fund.
            for(let i=0;i<tx.vout.length; i++) {
                // ignore this output if it's change
                if(account.changeAddresses?.find(ca => tx.vout[i].isAddress && ca.address == tx.vout[i].addresses[0])){
                    continue;
                }

                // Check if any of the wallet addresses is in output list of transaction
                // Theoretically, Transaction's output can be contained more than one wallet address
                // So, for each address, we may need to add a receive record
                const addressInOutputs = account.tokens?.find(element => tx.vout[i].isAddress && element.name == tx.vout[i].addresses[0]);

                if(addressInOutputs) {
                    let isFromOwnWallet = false;
                    let isOpReturn = false;

                    //! Check if it's OMNI/OP_RETURN transaction
                    for(let j = 0; j<tx.vout.length; j++) {
                        if(tx.vout[j].isAddress == false && tx.vout[j].hex?.substring(0,2) == "6a") {
                            isOpReturn = true;
                            break;
                        }
                    }

                    // If this is from OWN wallet? You can send BTC to your another address
                    for(let k=0; k<tx.vin.length; k++) {
                        if(account.tokens?.find(walletAddress => tx.vin[k].isAddress && walletAddress.name == tx.vin[k].addresses[0])) {
                            isFromOwnWallet = true;
                            break;
                        }
                    }

                    let status : 'RECEIVED' | 'RECEIVED_FROM_OWN' | 'OMNI_RECEIVED' | 'OMNI_CHANGE' = 'RECEIVED';
                    
                    if(isOpReturn) {
                        // is it dust
                        if(tx.vout[i].value == "546") {
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
                       address: addressInOutputs.name,
                       status:  status,
                       value: +tx.vout[i].value,
                    });
                }
            }

            // Add received transactions if any
            if(received.length > 0){
                txViewList.push({
                    hash: tx.txid,
                    blockNumber: tx.blockHeight,
                    date: new Date(tx.blockTime * 1000).toDateString(),
                    received: received,
                    isOmni: isOmni,
                });
            }

            let sent = new Array<WalletModel.BitcoinSentView>();

            // Check if any of the wallet addresses is available in TX inputs which means the address sent fund.
            for(let i=0; i < tx.vin.length; i++) {

                // To ignore the warning: this._bitcoinWallet.Accounts is possibly undefined
                if(this._bitcoinWallet.accounts == undefined)
                    break;

                // Find if there is any wallet address in this transaction's input
                let addressInInputs = account.tokens?.find(aa => tx.vin[i].isAddress && aa.name == tx.vin[i].addresses[0]);
                
                if(addressInInputs != undefined) {

                    //! If there is any OP_RETURN output
                    let isOpReturn = false;
                    //! If there is any Dust value in outputs
                    let isDust = false;

                    //! Check if there is a OP_RETURN 
                    for(let k = 0; k<tx.vout.length; k++) {
                        if(tx.vout[k].isAddress == false && tx.vout[k].hex?.substring(0,2) == "6a") {
                            isOpReturn = true;
                        }

                        if(tx.vout[k].value == "546") {
                            isDust = true;
                        }
                    }

                    if(isOpReturn && isDust) {
                        isOmni = true;
                    }

                    // To check how much we sent, we need to check the outputs
                    for( let j=0; j < tx.vout.length; j++ ) {
                        // If this output is a Change(because the value is returned to our wallet again), ignore it.
                        if(account.changeAddresses?.find(aa => tx.vout[j].isAddress && aa.address == tx.vout[j].addresses[0])) {
                             continue;
                        }

                        // To own address, Possibly OMNI
                        if(account.tokens?.find(aa => tx.vout[j].isAddress && aa.name == tx.vout[j].addresses[0])){
                            sent.push({
                                address: tx.vout[j].addresses[0],
                                value: +tx.vout[j].value,
                                status: (isDust && isOpReturn) ? ((tx.vout[j].value == "546") ? 'OMNI_SENT' : 'OMNI_CHANGE') : 'SENT_TO_OWN',
                            });

                            continue;
                        }

                        //! Ignore OP_RETURN VALUE 0 TX
                        if(isOpReturn && tx.vout[j].value == "0") {
                            continue;
                        }

                        sent.push({
                            address: tx.vout[j].addresses[0],
                            status: (isOpReturn && tx.vout[j].value == "546") ? 'OMNI_SENT' : 'SENT',
                            value: +tx.vout[j].value,
                        });
                    }

                    // No need to check the other inputs
                    break;
                }
            }

            if(sent.length > 0){
                txViewList.push({
                    hash: tx.txid,
                    blockNumber: tx.blockHeight,
                    sent: sent,
                    date: new Date(tx.blockTime * 1000).toDateString(),
                    fee: +tx.fees,
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
        if((totalSend+txFee) > +acc.balance){
            throw new Error("No sufficient balance in your account");
        }

        // update UTXO
        await this.UpdateAccountUtxos(acc);

        if(!acc.sortedUtxos || acc.sortedUtxos.length == 0) {
            throw new Error("UTXO list is empty or undefined");
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
            if (coinInfo.shortcut == 'ZEC') {
                const chainId = await this._bitcoinBlockchain.GetZcashChainId();
                if (chainId.chaintip) {
                    tx.options.branch_id = parseInt(chainId.chaintip, 16);
                } else throw new Error('Can not get Zcash chainId');
            }
        }

        MyConsole.Info("BitcoinWallet::GenerateTransaction->sortedUtoxs:", acc.sortedUtxos);

        //! Input addresses
        let utxoBal = 0;
        
        // Check if we can handle this transaction only with one Input
        if (+acc.sortedUtxos[0].value >= totalSend + txFee)
        {
            // if there is only one utxo
            if(acc.sortedUtxos.length == 1) {
                let utxo = acc.sortedUtxos[0];
                if(utxo.path == null) {
                    throw new Error("BitcoinWallet::GenerateTransaction->UTXO without path");
                }

                tx.inputs.push({
                    address_n: PathUtil.getHDPath(utxo.path),
                    prev_hash: utxo.txid,
                    prev_index: utxo.vout,
                    amount: utxo.value,
                });

                // balance of the UTXO
                utxoBal = +utxo.value;
            } else {
                // Search for the best match
                let i = 1;
                for (; i < acc.sortedUtxos.length; i++) {
                    if (+acc.sortedUtxos[i].value < totalSend + txFee)               
                        break;
                }
                // i is the best utxo for input
                let utxo = acc.sortedUtxos[i - 1];
                if(utxo.path == null) {
                    throw new Error("BitcoinWallet::GenerateTransaction->UTXO without path");
                }  
                // add this utxo to inputs
                tx.inputs.push({
                    address_n: PathUtil.getHDPath(utxo.path), 
                    prev_hash: utxo.txid, 
                    prev_index: utxo.vout,
                    amount: utxo.value
                });         

                // balance of the UTXO
                utxoBal = +utxo.value;
            }
        }
        else
        {
            // We need multi inputs to handle this transaction            
            for (let i = 0; i < acc.sortedUtxos.length; i++) {
                let utxo = acc.sortedUtxos[i];
                if(utxo.path == null) {
                    throw new Error("BitcoinWallet::GenerateTransaction->UTXO without path");
                }    
                // add this utxo to inputs       
                tx.inputs.push({
                    address_n: PathUtil.getHDPath(utxo.path), 
                    prev_hash: utxo.txid, 
                    prev_index: utxo.vout,
                    amount: utxo.value
                });  
                
                // balance of the UTXOs
                utxoBal += +utxo.value;

                if (utxoBal >= totalSend + txFee)
                    break;
            }
        }

        //! Load previous transactions 
        await this.LoadPrevTx(acc, tx);

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
        if(acc.changeAddresses && acc.changeAddresses.length > 0) {
            const pathOfLastChangeAddress = acc.changeAddresses[acc.changeAddresses.length-1].path;
            changeIndex = pathOfLastChangeAddress[4] + 1;
        }

        //! Add change
        //! Change is an output to ourself to which the rest of inputs will transfer
        //! Change is Sum(UTXOs) - total_amount_to_send - transaction_fee
        let change = utxoBal - totalSend - txFee;        

        let changePaths = PathUtil.GetBipPath(
            CoinBaseType.BitcoinBase,   // Coin Type
            fromAccount,              // Account Number
            coinInfo,                   // CoinInfo
            true,                       // Change addresses
            changeIndex,             // address index
        );

        //! No change if the change is less than dust
        if(coinInfo.dust_limit != null)
        {
            if(change >= coinInfo.dust_limit) { 
                tx.outputs.push({
                    address_n: changePaths.path,
                    amount: change.toFixed(0),
                    script_type: (coinInfo.segwit) ? EnumOutputScriptType.PAYTOP2SHWITNESS : EnumOutputScriptType.PAYTOADDRESS,
                });
            }
        }
        else if (change > 0) {
            tx.outputs.push({
                address_n: changePaths.path,
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
    public async SendTransaction(txData: string): Promise<GenericWalletModel.GenericSentTransactionResult>{
        return await this._bitcoinBlockchain.BroadCastTransaction(txData);
    }

    public async UpdateAccountUtxos(acc: WalletModel.BitcoinAccountInfo) {
        let utxos: WalletModel.BitcoinUtxoModel[] = [];
        if(this._servers.some(s => s.isSupportXpub == true)) {
            // Get public key
            let publicKey: AddressModel;
            if(acc.publicKey) {
                publicKey = acc.publicKey;
            } else { 
                publicKey = await this.GetAccountPublicKey(acc.accountIndex ?? 0);
            }

            // get all utxos
            utxos = await this._bitcoinBlockchain.GetAccountUtxoByPublicKey(publicKey.address)
        }
        //TODO: Get UTXO by address
        else {

        }

        acc.sortedUtxos = utxos.sort((a,b) => {
            const aValue = +a.value;
            const bValue = +b.value;
            if(aValue > bValue) {
                return -1;
            } 
            else if(aValue == bValue) {
                return 0;
            } 
            else {
                return 1;
            }
        });
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
        let txFees: WalletModel.BitcoinFee;
        if(super.GetCoinInfo().name == "Zcash") {
            txFees = {
                economy: 10, // per KB
                high: 10,
                normal: 10
            }
        }
        else
        {
            txFees = await this._bitcoinBlockchain.GetTxFee(coinInfo.name == 'Bitcoin');
        }

        // Calculate transaction length
        let txLen = await this.CalculateTxLen(receivers, acc, txFees);

        let fees: BitcoinFeeSelectionModel = {
            economy: Math.floor((txLen * txFees.economy)).toString(),
            normal: Math.floor((txLen * txFees.normal)).toString(),
            priority: Math.floor((txLen * txFees.high)).toString(),
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
    public async CalculateTxLen(receivers: Array<BitcoinOutputModel>, acc: WalletModel.BitcoinAccountInfo, txFees: WalletModel.BitcoinFee): Promise<number> {
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
        if(acc.sortedUtxos == null) {
            await this.UpdateAccountUtxos(acc);
        }

        if(acc.sortedUtxos == null || acc.sortedUtxos.length == 0) {
            MyConsole.Info("No UTXO");
            //! Bitcoin based transactions has 1 input at least
            return txLen + this._TX_DEFAULT_INPUT_SIZE;
        }

        MyConsole.Info("Sorted UTXO", acc.sortedUtxos);

        //! Input addresses
        let utxoBal = 0;
        let totalSend = 0;
        receivers.forEach(element => {
            totalSend += element.value;
        });

        // Check if we can handle this transaction only with one Input
        if (+acc.sortedUtxos[0].value >= totalSend + (txFees.economy * (txLen + this._TX_DEFAULT_INPUT_SIZE)))
        {         
            txLen += this._TX_DEFAULT_INPUT_SIZE;
        }
        else
        {
           // We need multi input to handle this transaction            
           for (let i = 0; i < acc.sortedUtxos.length; i++) {          
                txLen += this._TX_DEFAULT_INPUT_SIZE;
                utxoBal += +acc.sortedUtxos[i].value;

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
     * Loading previous transaction of each input(s).
     * @param tx Bitcoin transaction 
     */
    private async LoadPrevTx(acc: WalletModel.BitcoinAccountInfo, tx: BitcoinTx) {
        if(tx.inputs == undefined || tx.inputs.length == 0){
            throw new Error("BitcoinWallet::LoadPrevTx->Transaction inputs cannot be null or empty");
        }

        if(acc.transactions == null || acc.transactions.length == 0) {
            throw new Error("BitcoinWallet::LoadPrevTx->PrevTx are not set correctly")
        }

        tx.refTxs = new Array<RefTransaction>();
        tx.inputs.forEach(txInput => {
            
            let prev = acc.transactions?.find(t => t.txid == txInput.prev_hash);
            if(prev == null) {
                throw new Error("BitcoinWallet::LoadPrevTx->No transaction found for this UTXO")
            }

            let ref: RefTransaction = {
                hash: prev.txid,
                version: prev.version,
                lock_time: prev.lockTime ?? 0,
                bin_outputs: [],
                inputs: [],
            }

            prev.vin.forEach( inp => {
                if(inp.txid == null) {
                    throw new Error("BitcoinWallet::LoadPrevTx->PrevTransation id is null");
                }

                if(inp.hex == null) {
                    throw new Error("BitcoinWallet::LoadPrevTx->PrevTransation hex is null");
                }

                ref.inputs.push({
                    prev_hash: inp.txid,
                    prev_index: inp.vout ?? 0,
                    sequence: inp.sequence,
                    script_sig: inp.hex,
                });
            });

            prev.vout.forEach( out => {
                if(out.hex == null) {
                    throw new Error("BitcoinWallet::LoadPrevTx->PrevTransation hex is null");
                }
                ref.bin_outputs.push({
                    amount: out.value,
                    script_pubkey: out.hex,
                })
            });

            if(tx.refTxs){
                tx.refTxs.push(ref);
            }
        });
    }
}

