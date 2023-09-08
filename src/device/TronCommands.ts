/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
 * Hadi Robati, hadi@prokey.io
 * Ali Akbar Mohammadi
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

import { CoinBaseType, CoinInfo } from '../coins/CoinInfo';
import { TronCoinInfoModel } from '../models/CoinInfoModel';
import { Device } from './Device';
import { ICoinCommands } from './ICoinCommand';
import { GeneralErrors } from '../models/GeneralResponse';
import { TronTransaction } from '../models/TronTx';
import * as ProkeyResponses from '../models/Prokey';
import * as PathUtil from '../utils/pathUtils';
import * as Utils from '../utils/utils';

export class TronCommands implements ICoinCommands {
    private _coinInfo: TronCoinInfoModel;

    public constructor(coinName: string) {
        this._coinInfo = CoinInfo.Get<TronCoinInfoModel>(coinName, CoinBaseType.Tron);
        if (this._coinInfo == null) {
            throw new Error(`Cannot load CoinInfo for ${coinName}`);
        }
    }

    /**
     * Get Tron address
     * @param device Prokey device instance
     * @param path BIP path
     * @param showOnProkey true means show the address on device display
     */
    public async GetAddress(
        device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean
    ): Promise<ProkeyResponses.TronAddress> {
        if (device == null || path == null) {
            return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
        }

        let showDisplay = showOnProkey == null ? true : showOnProkey;

        // convert path to array of num
        let address_n: Array<number>;
        if (typeof path == 'string') {
            try {
                address_n = PathUtil.getHDPath(path);
            } catch (e) {
                return Promise.reject({ success: false, errorCode: GeneralErrors.PATH_NOT_VALID });
            }
        } else {
            address_n = path;
        }

        let param = {
            address_n: address_n,
            show_display: showDisplay,
        };

        return await device.SendMessage<ProkeyResponses.TronAddress>('TronGetAddress', param, 'TronAddress');
    }

    public async GetAddresses(
        device: Device,
        paths: Array<Array<number> | string>
    ): Promise<Array<ProkeyResponses.TronAddress>> {
        if (device == null || paths == null) {
            return Promise.reject({
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM,
            });
        }

        let lstAddress = new Array<ProkeyResponses.TronAddress>();

        paths.forEach(async (path) => {
            lstAddress.push(await this.GetAddress(device, path, false));
        });

        return lstAddress;
    }

    /**
     * Get Public key
     * @param device The prokey device
     * @param path BIP path
     * @param showOnProkey true means show the public key on prokey display
     */
    public async GetPublicKey(
        device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean
    ): Promise<ProkeyResponses.PublicKey> {
        if (device == null || path == null) {
            return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
        }

        let showDisplay = showOnProkey == null ? true : showOnProkey;

        // convert path to array of num
        let address_n: Array<number>;
        if (typeof path == 'string') {
            try {
                address_n = PathUtil.getHDPath(path);
            } catch (e) {
                return Promise.reject({ success: false, errorCode: GeneralErrors.PATH_NOT_VALID });
            }
        } else {
            address_n = path;
        }

        let param = {
            address_n: address_n,
            show_display: showDisplay,
        };

        return await device.SendMessage<ProkeyResponses.PublicKey>('GetPublicKey', param, 'PublicKey');
    }

    /**
     * Sign a tron transaction
     * @param device The prokey device
     * @param transaction Tron transaction
     * @returns Signed serialized tron transaction ready to broadcast
     */
    public async SignTransaction(device: Device, transaction: TronTransaction): Promise<ProkeyResponses.TronSignedTx> {
        return await device.SendMessage<ProkeyResponses.TronSignedTx>('TronSignTx', transaction, 'TronSignedTx');
    }

    /**
     * Sign Message
     * @param device Prokey device instance
     * @param address_n array of BIP32/44 Path
     * @param message message to be signed
     * @param coin coin name
     */
    public async SignMessage(
        device: Device,
        address_n: Array<number>,
        message: Uint8Array,
        coin?: string
    ): Promise<ProkeyResponses.MessageSignature> {
        let scriptType = PathUtil.GetScriptType(address_n);

        let res = await device.SendMessage<ProkeyResponses.MessageSignature>(
            'SignMessage',
            {
                address_n: address_n,
                message: message,
                coin_name: coin || 'Tron',
                script_type: scriptType,
            },
            'MessageSignature'
        );

        if (res.signature) {
            res.signature = Utils.ByteArrayToHexString(res.signature);
        }

        return res;
    }

    /**
     * Verify Message
     * @param device Prokey device instance
     * @param address address
     * @param message message
     * @param signature signature data
     * @param coinName coin name
     */
    public async VerifyMessage(
        device: Device,
        address: string,
        message: Uint8Array,
        signature: Uint8Array,
        coinName: string
    ): Promise<ProkeyResponses.Success> {
        return await device.SendMessage<ProkeyResponses.Success>(
            'VerifyMessage',
            {
                address: address,
                signature: signature,
                message: message,
                coin_name: coinName || 'Tron',
            },
            'Success'
        );
    }
}
