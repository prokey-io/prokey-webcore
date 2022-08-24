/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) 2022 Prokey.io
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

import { BlockchainBase } from './BlockchainBase';
import * as WalletModel from '../models/EthereumWalletModel';
import { BlockchainServerModel } from './BlockchainProviders';
import { BlockbookServer } from './_servers/blockbook/BlockbookServer';
import { BlockbookDetails, BlockbookRequestDetails } from './_servers/blockbook/BlockbookRequestModels';
import { MyConsole } from '../utils/console';
import { AddressModel } from '../models/Prokey';
import * as GenericWalletModel from '../models/GenericWalletModel';
import * as BlockbookModels from './_servers/blockbook/BlockbookEthereumModel';
import { GetGasParams } from '../utils/ethereum-providers';
import { FeeData } from '@ethersproject/providers';
import PublicEthereumServer from './_servers/public/PublicEthereumServer';
import { Erc20BaseCoinInfoModel, EthereumBaseCoinInfoModel } from '../models/CoinInfoModel';
import { BlockbookTransactionResult } from './_servers/blockbook/BlockbookCommonModel';

export class EthereumBlockchain extends BlockchainBase {
    private _isErc20: boolean;
    private _coinInfo?: Erc20BaseCoinInfoModel | EthereumBaseCoinInfoModel;

    constructor(
        servers: BlockchainServerModel[],
        isErc20 = false,
        coinInfo?: Erc20BaseCoinInfoModel | EthereumBaseCoinInfoModel
    ) {
        super(servers);

        this._isErc20 = isErc20;
        this._coinInfo = coinInfo;
    }

    /**
     * Get address info
     * @param reqAdd The address
     * @returns Bitcoin Address Info
     */
    public async GetAddressInfo(reqAdd: AddressModel): Promise<WalletModel.EthereumAccountInfo> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            switch (this._servers[i].apiType) {
                case 'blockbook':
                    const req = new BlockbookRequestDetails();
                    req.details = BlockbookDetails.Txs;

                    try {
                        let addInfo: WalletModel.EthereumAccountInfo =
                            await BlockbookServer.GetAddressInfo<BlockbookModels.EthereumAddressModel>(
                                this._servers[i],
                                reqAdd.address,
                                req
                            );

                        //! Add address model
                        addInfo.addressModel = reqAdd;

                        return addInfo;
                    } catch (e) {
                        MyConsole.Exception('EthereumBlockchain::GetAddressInfo->', e);
                    }
                    break;
                case 'geth':
                    try {
                        let providerResponse: WalletModel.EthereumAccountInfo =
                            await PublicEthereumServer.GetAddressInfo(
                                this._servers[i],
                                reqAdd.address,
                                this._isErc20,
                                this._coinInfo
                            );
                        providerResponse.addressModel = reqAdd;
                        return providerResponse;
                    } catch (e) {
                        MyConsole.Exception('EthereumBlockchain::GetAddressInfo->', e);
                    }
            }
        }

        throw new Error('EthereumBlockchain::GetAddressInfo->No server to handle the request');
    }

    public async GetFeeData(chainId: number): Promise<FeeData> {
        return await GetGasParams(chainId);
    }

    public async BroadCastTransaction(transaction: string): Promise<GenericWalletModel.GenericSentTransactionResult> {
        this._ensureThereIsAServer();
        for (let i = 0; i < this._servers.length; i++) {
            let result: BlockbookTransactionResult | undefined;
            try {
                switch (this._servers[i].apiType) {
                    case 'blockbook':
                        result = await BlockbookServer.BroadcastTransaction(this._servers[i], transaction);
                        break;
                    case 'publicProvider':
                        result = await PublicEthereumServer.BroadcastTransaction(this._servers[i], transaction);
                }

                if (!result) {
                    return {
                        isSuccess: false,
                        error: 'Send transaction neither have result or error',
                    };
                }

                if (result.result) {
                    return {
                        isSuccess: true,
                        txid: result.result,
                    };
                } else if (result.error) {
                    return {
                        isSuccess: false,
                        error: result.error,
                    };
                } else {
                    MyConsole.Info(
                        'EthereumBlockchain::BroadCastTransaction->Send transaction neither have result or error'
                    );
                    return {
                        isSuccess: false,
                        error: 'Send transaction neither have result or error',
                    };
                }
            } catch (e) {
                MyConsole.Exception('EthereumBlockchain::BroadCastTransaction->', e);
            }
        }

        throw new Error('EthereumBlockchain::BroadCastTransaction->No server to handle the request');
    }

    //**********************
    // PRIVATE FUNCTIONS
    //**********************
    private _ensureThereIsAServer() {
        if (this._servers == undefined || this._servers.length == 0) {
            throw new Error('EthereumBlockchain::_ensureThereIsAServer->No server');
        }
    }
}
