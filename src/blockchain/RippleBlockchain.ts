import { BlockchainProviders, BlockchainServerModel } from './BlockchainProviders';
import { BlockchainBase } from './BlockchainBase';
import { BaseCoinInfoModel } from '../models/CoinInfoModel';
import { RippleServer } from './_servers/ripple/RippleRpcServer';
import {
    RippleAccountData,
    RippleFee,
    RippleTransactionDataInfo,
    RippleTransactionResponse,
} from './_servers/ripple/RippleRpcModel';
import { MyConsole } from '../utils/console';
import { AddressModel } from '../models/Prokey';
import * as WalletModel from '../models/RippleWalletModel';

type ProcessServersCallBack<T> = (server: BlockchainServerModel) => Promise<T>;
type ProcessServersError = (error: any) => void;

export class RippleBlockchain extends BlockchainBase {
    constructor(coinInfo: BaseCoinInfoModel) {
        const servers: Array<BlockchainServerModel> = BlockchainProviders.Get(coinInfo);
        super(servers);
    }

    public async GetAddressInfo(reqAdd: AddressModel): Promise<WalletModel.RippleAccountInfo> {
        this._ensureThereIsAServer();

        for (let i = 0; i < this._servers.length; i++) {
            try {
                let res = await RippleServer.GetAddressInfo(this._servers[i], reqAdd.address);
                if (res.status == 'success') {
                    if (res.account_data == null) {
                        throw new Error('Status is success but there is no account_data');
                    }

                    return {
                        ...res.account_data,
                        isAccountFounded: true,
                        addressModel: reqAdd,
                    };

                } else {
                    // If this account/address is not available, the server returns "Account not found." with following data: 
                    //  "error": "actNotFound"
                    //  "error_code": 19,
                    //  "error_message": "Account not found.",
                    // in this case, An empty account info with "isAccountFounded: false" flag will be retuned
                    if(res.error == 'actNotFound') {
                        return <WalletModel.RippleAccountInfo>{
                            isAccountFounded: false,
                            addressModel: reqAdd,
                        };
                    }

                    // If there is any error message
                    if (res.error_message) {
                        throw new Error(res.error_message);
                    }
                }
            } catch (e) {
                MyConsole.Exception('RippleBlockchain::GetAddressInfo->', e);
            }
        }

        throw new Error('RippleBlockchain::GetAddressInfo->Request has error');
    }

    public async BroadCastTransaction(transaction: string): Promise<WalletModel.RippleTransactionResponse> {
        this._ensureThereIsAServer();
        return this.foreachServer<RippleTransactionResponse>(
            async (server) => {
                return await RippleServer.BroadCastTransaction(server, transaction);
            },
            (error) => {
                MyConsole.Exception('RippleBlockchain::BroadCastTransaction->', error);
            }
        );
    }

    async GetAccountTransactions(
        account: string,
        limit: number = 10
    ): Promise<Array<WalletModel.RippleTransactionDataInfo>> {
        this._ensureThereIsAServer();
        return this.foreachServer<Array<RippleTransactionDataInfo>>(
            async (server) => {
                return await RippleServer.GetAccountTransactions(server, account, limit);
            },
            (error) => {
                MyConsole.Exception('RippleBlockchain::GetAccountTransactions->', error);
            }
        );
    }

    async GetFee(): Promise<WalletModel.RippleFee> {
        this._ensureThereIsAServer();
        return this.foreachServer<RippleFee>(
            async (server) => {
                return await RippleServer.GetCurrentFee(server);
            },
            (error) => {
                MyConsole.Exception('RippleBlockchain::GetFee->', error);
            }
        );
    }

    private async foreachServer<T>(
        callback: ProcessServersCallBack<T>,
        errorCallback: ProcessServersError
    ): Promise<T> {
        for (const server of this._servers) {
            try {
                return await callback(server);
            } catch (e: any) {
                errorCallback(e);
            }
        }
        throw new Error('there is no provider that respond to this request');
    }

    private _ensureThereIsAServer() {
        if (this._servers == undefined || this._servers.length == 0) {
            throw new Error('RippleBlockchain::_ensureThereIsAServer->No server');
        }
    }
}
