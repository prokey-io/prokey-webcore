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

import * as WalletModel from '../models/EthereumWalletModel';
import * as GenericWalletModel from '../models/GenericWalletModel';
import { CoinBaseType } from '../coins/CoinInfo';
import { Device } from '../device/Device';
import * as PathUtil from '../utils/pathUtils';
import { EthereumBaseCoinInfoModel, Erc20BaseCoinInfoModel } from '../models/CoinInfoModel';
import { EthereumTx } from '../models/EthereumTx';
import { RlpEncoding } from '../utils/rlp-encoding';
import * as ProkeyResponses from '../models/Prokey';
import { EthereumBlockchain } from '../blockchain/EthereumBlockchain';
import { BaseWallet } from './BaseWallet';
import { EthereumAddress } from '../models/Prokey';
import { MyConsole } from '../utils/console';
import * as EthereumNetworks from '../utils/ethereum-networks';
import BigNumber from 'bignumber.js';
import { BlockchainProviders, BlockchainServerModel } from '../blockchain/BlockchainProviders';
import { EstimateGasLimit } from '../utils/ethereum-providers';
import { TransactionRequest, FeeData } from '@ethersproject/providers';
import { supportsEIP1559 } from '../utils/DeviceUtils';
var WAValidator = require('multicoin-address-validator');

/**
 * If you wish to discover and use your ethereum wallet, you need to use this class.
 * This class can be used for all ethereum based coins and all ERC20.
 */
export class EthereumWallet extends BaseWallet {
    _ethereumWallet!: WalletModel.EthereumWalletModel;
    _gasLimit: number = 21000;
    _ethBlockchain: EthereumBlockchain;
    _isErc20 = false;
    _network = 'eth';
    _contractAddress: string = '';
    private _servers: BlockchainServerModel[];

    /**
     * class constructor
     * @param device Prokey device instance
     * @param coinNameOrContractAddress Coin name or contract address of ERC20, Check /data/ProkeyCoinsInfo.json
     * @param isErc20 Should be true if ERC20 is desired.
     * @param coinInfo Optional coin info, If this parameter is not null, the wallet skips coinNameOrContractAddress
     */
    constructor(
        device: Device,
        coinNameOrContractAddress: string,
        isErc20: boolean,
        coinInfo?: Erc20BaseCoinInfoModel | EthereumBaseCoinInfoModel
    ) {
        //! If coinInfo parameter is not null, the value of coinNameOrContractAddress doesn't matter
        super(
            device,
            coinNameOrContractAddress,
            isErc20 == true ? CoinBaseType.ERC20 : CoinBaseType.EthereumBase,
            undefined,
            coinInfo
        );

        this._isErc20 = isErc20;
        if (isErc20) {
            if (coinInfo) {
                this._contractAddress = (coinInfo as Erc20BaseCoinInfoModel).address;
            } else {
                this._contractAddress = coinNameOrContractAddress;
            }
        }

        this._servers = BlockchainProviders.Get(super.GetCoinInfo());

        if (isErc20) {
            this._gasLimit = 65000;
            const ci = super.GetCoinInfo() as Erc20BaseCoinInfoModel;
            this._network = EthereumNetworks.GetNetworkByChainId(ci.chain_id);
            this._ethBlockchain = new EthereumBlockchain(this._servers, true, ci);
        } else {
            const ci = this.GetCoinInfo() as EthereumBaseCoinInfoModel;
            this._network = EthereumNetworks.GetNetworkByChainId(ci.chain_id);
            this._ethBlockchain = new EthereumBlockchain(this._servers);
        }
    }

    /**
     * Start searching blockchain to discovery(find) the wallet
     * @param accountFindCallBack is an optional callback function, this function will be called when an account discovered
     * @returns Ethereum Wallet Model
     */
    public async StartDiscovery(
        accountFindCallBack?: (accountInfo: WalletModel.EthereumAccountInfo) => void,
        allAccounts = false
    ): Promise<WalletModel.EthereumWalletModel> {
        this._ethereumWallet = {
            totalBalance: 0,
        };

        return new Promise<WalletModel.EthereumWalletModel>(async (resolve, reject) => {
            let an = 0;
            try {
                do {
                    // Discover the account number n
                    let account = await this.AccountDiscovery(an);

                    if (this._ethereumWallet.accounts == undefined) {
                        this._ethereumWallet.accounts = new Array<WalletModel.EthereumAccountInfo>();
                    }

                    // For unit test purposes
                    if (
                        this._ethereumWallet.accounts.length > 0 &&
                        this._ethereumWallet.accounts[an - 1].address == account.address
                    ) {
                        return resolve(this._ethereumWallet);
                    }

                    // Don't add empty account to list of accounts
                    if (an > 0 && account.txs == 0) {
                        return resolve(this._ethereumWallet);
                    }

                    this._ethereumWallet.accounts.push(account);

                    // Calling callback to update the UI
                    if (accountFindCallBack) {
                        accountFindCallBack(account);
                    }

                    // update the total wallet balance
                    this._ethereumWallet.totalBalance += +account.balance;

                    // go for next account
                    an++;
                } while (true);
            } catch (reason) {
                reject(reason);
            }
        });
    }

    /**
     * Account Discovery
     * @param accountNumber account number to be discovered
     */
    public async AccountDiscovery(accountNumber: number = 0): Promise<WalletModel.EthereumAccountInfo> {
        let path = PathUtil.GetBipPath(
            this._isErc20 ? CoinBaseType.ERC20 : CoinBaseType.EthereumBase, // CoinType
            accountNumber, // Account Number
            super.GetCoinInfo() // Coin Info
        );

        // Getting addresses from Prokey
        let address = await super.GetAddress<EthereumAddress>(path.path, false);

        path.address = address.address;

        // Getting addresses' info
        var accInfo = await this._ethBlockchain.GetAddressInfo(path);
        accInfo.accountIndex = accountNumber;

        // When using public nodes there are no transactions or token transfers
        // because they don't give transaction history.
        // so if isDirectQueryFromGeth is true we don't continue the code and directly return the account info
        if (accInfo.isDirectQueryFromGeth) return accInfo;

        // Should do some changes and filters to the account if it is erc20 contract
        if (this._isErc20) {
            accInfo.ethBalance = accInfo.balance;
            if (accInfo.transactions && accInfo.transactions.length > 0) {
                // Filter contract transactions and reassign to account
                const erc20Transactions = accInfo.transactions.filter((tx) => {
                    if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
                        return tx.tokenTransfers[0].token == this._contractAddress;
                    }
                    return false;
                });
                accInfo.transactions = erc20Transactions;
                accInfo.txs = erc20Transactions.length;

                // Reassign balance with contract token balance
                if (accInfo.tokens && accInfo.tokens.length > 0) {
                    const tokenBalance = accInfo.tokens.find(
                        (token) => token.contract == this._contractAddress
                    )?.balance;
                    if (tokenBalance) {
                        accInfo.balance = tokenBalance;
                    } else {
                        accInfo.balance = '0';
                    }
                } else {
                    accInfo.balance = '0';
                }

                delete accInfo.tokens;
            }
        } else if (!this._isErc20) {
            // Only return transactions if eth token is transferred
            const transactions = accInfo.transactions?.filter((tx) => {
                return tx.tokenTransfers == undefined;
            });
            if (transactions) {
                accInfo.transactions = transactions;
            }
        }

        MyConsole.Info('EthereumWallet::AccountDiscovery->Account info:', accInfo);

        return accInfo;
    }

    /**
     * This function generates an ethereum transaction
     * @param receivedAddress Address to send the fund
     * @param amount Amount to be sent in WEI
     * @param accountNumber Account number to send fund from
     */
    public async GenerateTransaction(
        receivedAddress: string,
        amount: BigNumber,
        accountNumber: number = 0
    ): Promise<EthereumTx> {
        // Check if wallet is already loaded
        if (this._ethereumWallet == null || this._ethereumWallet.accounts == null) {
            throw new Error('Wallet is not loaded');
        }

        // Validate accountNumber
        if (accountNumber >= this._ethereumWallet.accounts.length) {
            throw new Error('Account number is wrong');
        }

        // Cast coin info model
        let coinInfo = super.GetCoinInfo() as Erc20BaseCoinInfoModel | EthereumBaseCoinInfoModel;

        // Estimate the transaction gas limit
        if (this._isErc20) {
            try {
                const tx: TransactionRequest = {
                    to: this._contractAddress,
                    data: '0x' + this.GetErc20TransactionData(receivedAddress, amount),
                };
                this._gasLimit = (await EstimateGasLimit(coinInfo.chain_id, tx)).toNumber();
            } catch (error) {
                this._gasLimit = 65000;
            }
        }

        const deviceFeatures = await this.GetDevice().GetFeatures();
        const deviceSupportsEIP1559 = supportsEIP1559(deviceFeatures, this._network);
        // Get the gas params from server
        const feeData = await this._ethBlockchain.GetFeeData(coinInfo.chain_id);
        const transactionFee = await this.CalculateTransactionFee(deviceSupportsEIP1559, feeData);

        // Get the account
        let account = this._ethereumWallet.accounts[accountNumber];

        if (account.addressModel == null) {
            throw new Error('Invalid data');
        }

        let nonce = '0';
        if (this._isErc20) {
            // Check transaction fee
            if (account.ethBalance == null || transactionFee > +account.ethBalance) {
                let networkName = EthereumNetworks.GetNetworkFullNameByChainId(coinInfo.chain_id);
                throw new Error(`Insufficient balance in the ${networkName} wallet to pay the transaction fee`);
            }

            // Check account balance
            if (amount.gt(account.balance)) {
                throw new Error('Insufficient balance');
            }

            // Set the nonce
            nonce = account.nonce || '0';
        } else {
            // Check account balance
            if (amount.gt(account.balance)) {
                throw new Error('Insufficient balance');
            }

            // Check account balance for pay the tx fee

            if (amount.gt(+account.balance - transactionFee)) {
                throw new Error('Insufficient balance to pay the transaction fee');
            }

            // Set the nonce
            nonce = account.nonce || '0';
        }

        // Generate Transaction
        let txToSign: EthereumTx = <EthereumTx>{
            address_n: account.addressModel.path,
            to: receivedAddress,
            value: amount.toString(16),
            nonce: nonce,
            gasLimit: this._gasLimit.toString(16),
            chainId: coinInfo.chain_id,
        };

        // Check if device supports EIP1559 and set fee based on that.
        if (deviceSupportsEIP1559) {
            // EIP1559 gas params
            txToSign.maxFeePerGas = feeData.maxFeePerGas?.toHexString();
            txToSign.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toHexString();
        } else {
            // Legacy gas param
            txToSign.gasPrice = feeData.gasPrice?.toHexString();
        }

        if (this._isErc20) {
            //! TO ERC20 contract address
            txToSign.to = this._contractAddress;
            //! Value should be empty
            txToSign.value = '0';

            txToSign.data = this.GetErc20TransactionData(receivedAddress, amount);
        }

        return txToSign;
    }

    /**
     * This function will prepare raw RLP encoded transaction to be sent
     * @param transaction Signed Transaction
     * @param signedValues Signature values, R,S and V
     */
    public async PrepareAndSendTransaction(transaction: EthereumTx, signedValues: ProkeyResponses.EthereumSignedTx) {
        if (transaction == undefined) {
            throw new Error('Transaction can not be null');
        }

        if (signedValues == undefined) {
            throw new Error('SignedValues can not be null');
        }

        let rlpTx = '';
        // Encoding transaction
        if (transaction.gasPrice != null) {
            rlpTx = this.legacyTxRlpEncode(transaction, signedValues);
        } else {
            rlpTx = this.eip1559TxRlpEncode(transaction, signedValues);
        }

        console.log(rlpTx);

        return await this.SendTransaction(rlpTx);
    }

    /**
     * To send a transaction to the network
     * @param txData Transaction to be sent to the network
     */
    public async SendTransaction(txData: string): Promise<GenericWalletModel.GenericSentTransactionResult> {
        return this._ethBlockchain.BroadCastTransaction(txData);
    }

    /**
     * To get a list of transaction to show to end user on the UI
     * @param accountNumber
     * @param startIndex
     * @param numberOfTransactions
     */
    public async GetTransactionViewList(
        accountNumber: number = 0,
        startIndex: number = 0,
        numberOfTransactions: number
    ): Promise<Array<WalletModel.EthereumTransactionView>> {
        if (this._ethereumWallet.accounts == null) {
            throw new Error('There is no account in wallet, Do Wallet Discovery First');
        }

        // Validate account
        if (accountNumber >= this._ethereumWallet.accounts.length) {
            throw new Error(`Cannot fine account #${accountNumber}`);
        }

        // WE ONLY CHECK THE CURRENT ACCOUNT
        const account = this._ethereumWallet.accounts[accountNumber];

        let txViews = new Array<WalletModel.EthereumTransactionView>();

        if (account.transactions == undefined || account.transactions.length == 0) {
            return txViews;
        }

        account.transactions.forEach((tx) => {
            let isSent = false;
            // To skip the warning/error
            if (account.addressModel != undefined) {
                isSent = account.addressModel.address.toLowerCase() == tx.vin[0].addresses[0].toLocaleLowerCase();
            }

            let txView: WalletModel.EthereumTransactionView = {
                blockNumber: tx.blockHeight,
                hash: tx.txid,
                fee: +tx.fees,
                date: new Date(tx.blockTime * 1000).toLocaleString(),
                status: isSent ? 'SENT' : 'RECEIVED',
                amount: this._isErc20 ? +tx.tokenTransfers[0].value : +tx.value,
            };

            if (isSent) {
                txView.sent = tx.vout[0].addresses[0];
            } else {
                txView.received = tx.vin[0].addresses[0];
            }

            txViews.push(txView);
        });

        return txViews;
    }

    /**
     * Validation Ethereum\ERC20\ETC and etc address
     * @param address The address to be checked
     */
    public IsAddressValid(address: string): boolean {
        let coinInfo = this.GetCoinInfo();

        let symbol: string = coinInfo.shortcut.toLocaleLowerCase();
        //! these coins are use same address encoding model
        if (this._isErc20 || symbol == 'bnb' || symbol == 'okt' || symbol == 'rbtc' || coinInfo.test == true) {
            symbol = 'ETH';
        }

        if (coinInfo.test != undefined && coinInfo.test) {
            if (symbol.substr(0, 1) == 't') {
                symbol = symbol.substring(1);
            }
        }

        if (!WAValidator.findCurrency(symbol)) {
            return false;
        }

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
     * Get the transaction fee
     * @returns TransactionFee
     * Legacy: GasLimit * GasPrice
     * EIP1559 : GasLimit * maxFeePerGas
     */
    public async CalculateTransactionFee(isEIP1559 = false, feeData?: FeeData): Promise<number> {
        if (!feeData) {
            feeData = await this._ethBlockchain.GetFeeData((super.GetCoinInfo() as Erc20BaseCoinInfoModel).chain_id);
        }

        if (isEIP1559) {
            // The maximum fee user is willing to pay for this transaction is calculated here that inclusive baseFeePerGas & maxPriorityFeePerGas
            // However, this is not the actual fee that the user will pay, the actual will be:
            // GasLimit * (baseFeePerGas + maxPriorityFeePerGas)
            // To make sure that user has enough balance and this transaction will be confirmed, we consider transaction fee as GasLimit * maxFeePerGas
            // Note: maxFeePerGas = (2 * baseFeePerGas) + maxPriorityFeePerGas
            return this._gasLimit * feeData.maxFeePerGas!.toNumber();
        }

        return feeData.gasPrice!.toNumber() * this._gasLimit;
    }

    private legacyTxRlpEncode(tx: EthereumTx, signedValues: ProkeyResponses.EthereumSignedTx) {
        let nonce = tx.nonce == '0' || tx.nonce == '00' ? '' : tx.nonce;
        let value = tx.value == '0' || tx.value == '00' ? '' : tx.value;
        const { r, s, v } = signedValues;
        let rlp: RlpEncoding = new RlpEncoding();

        const rawTx = [
            '0x' + nonce,
            '0x' + (tx.gasPrice || ''),
            '0x' + (tx.gasLimit || ''),
            '0x' + tx.to.toLowerCase() || '',
            '0x' + value,
            '0x' + (tx.data || ''),
        ];

        const toEncode = [...rawTx, ...[v, r, s]];
        return '0x' + rlp.encode(toEncode).toString('hex');
    }

    private eip1559TxRlpEncode(tx: EthereumTx, signedValues: ProkeyResponses.EthereumSignedTx) {
        let nonce = tx.nonce == '0' || tx.nonce == '00' ? '' : tx.nonce;
        let value = tx.value == '0' || tx.value == '00' ? '' : tx.value;
        let v = signedValues.v == '0x0' || signedValues.v == '0x00' ? '' : signedValues.v;

        let rlp: RlpEncoding = new RlpEncoding();

        console.log(signedValues);

        const rawTx = [
            '0x' + (tx.chainId || ''),
            '0x' + nonce,
            '0x' + tx.maxPriorityFeePerGas,
            '0x' + tx.maxFeePerGas,
            '0x' + (tx.gasLimit || ''),
            '0x' + tx.to.toLowerCase() || '',
            '0x' + value,
            '0x' + (tx.data || ''),
            [],
        ];

        const toEncode = [...rawTx, ...[v, signedValues.r, signedValues.s]];
        return '0x02' + rlp.encode(toEncode).toString('hex');
    }

    /**
     * Get address info of ETH address, For signing an ERC20 transaction, The last nonce number of ETH address is needed.
     * @param address ETH address
     */
    private async GetEthAddressInfo(address: string): Promise<WalletModel.EthereumAccountInfo> {
        var ethBlockchain = new EthereumBlockchain(this._servers);
        var addInfo = await ethBlockchain.GetAddressInfo({
            address: address,
            path: [],
        });

        return addInfo;
    }

    /**
     * Estimate the transaction fee (GasLimit)
     * @param from The wallet address
     * @param to The receiver address
     * @param data ERC20 Data (Function call with parameters)
     * @returns Estimated fee for this transaction
     */
    // private async EstimateFee(from: string, to: string, data: string): Promise<number> {
    //     try {
    //         var fee = await this._ethBlockChain.EstimateFee(from, to, data);

    //         if (fee < 40000)
    //             fee = 40000;
    //         return fee;
    //     } catch (error) {
    //         return 65000;
    //     }
    // }

    /**
     * Get ERC20 data for calling "TransferTo" function
     * @param receivingAddress The receiver address
     * @param amount Amount to be send
     * @returns Data in string
     */
    private GetErc20TransactionData(receivingAddress: string, amount: BigNumber): string {
        //! The address must not start with 0x
        if (receivingAddress.substr(0, 2).toLowerCase() == '0x') {
            receivingAddress = receivingAddress.substr(2);
        }

        let amountInHex = amount.toString(16);
        let amount64 = ('0000000000000000000000000000000000000000000000000000000000000000' + amountInHex).substr(-64);
        //! Data struct is 16Bytes * TransferTo(a9059cbb...) + 20Bytes * receiverAddress + 32Bytes * amount
        return `a9059cbb000000000000000000000000${receivingAddress}${amount64}`; //! SmartContract function call
    }
}
