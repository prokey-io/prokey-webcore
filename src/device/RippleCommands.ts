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

import { ICoinCommands } from './ICoinCommand';
import * as ProkeyResponses from '../models/Prokey';
import * as PathUtil from '../utils/pathUtils';
import * as Utility from '../utils/utils';
import { RippleCoinInfoModel } from '../models/CoinInfoModel';
import { CoinInfo, CoinBaseType } from '../coins/CoinInfo';
import { Device } from './Device';
import { GeneralResponse, GeneralErrors } from '../models/GeneralResponse';
import { RippleTransaction } from '../models/Responses-V6';
import { RippleAddress } from '../models/Prokey';
import { MyConsole } from '../utils/console';
import { validateParams } from '../utils/paramsValidator';

export class RippleCommands implements ICoinCommands {

    private _coinInfo: RippleCoinInfoModel;

    constructor(coinName: string) {
        this._coinInfo = CoinInfo.Get<RippleCoinInfoModel>(coinName, CoinBaseType.Ripple);
        if (this._coinInfo == null) {
            throw new Error(`Cannot load CoinInfo for ${coinName}`);
        }
    }

    /**
    * Get Bitcoin/Litecoin and etc address
    * @param device Prokey device instance
    * @param path BIP path 
    * @param showOnProkey true means show the address on device display
    */
    public async GetAddress(device: Device, path: Array<number>, showOnProkey?: boolean): Promise<ProkeyResponses.RippleAddress> {
        if (device == null || path == null) {
            return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
        }

        let showDisplay = (showOnProkey == null) ? true : showOnProkey;

        // convert path to array of num
        let address_n: Array<number>;
        if (typeof path == "string") {
            try {
                address_n = PathUtil.getHDPath(path);
            }
            catch (e) {
                return Promise.reject({ success: false, errorCode: GeneralErrors.PATH_NOT_VALID });
            }

        } else {
            address_n = path;
        }

        let param = {
            address_n: address_n,
            show_display: showDisplay,
        }

        return await device.SendMessage<ProkeyResponses.RippleAddress>('RippleGetAddress', param, 'RippleAddress');
    }

    /**
     * Get List of addresses, This function is useful in account discovery
     * @param device the prokey device instance
     * @param paths list of paths to retrive the addresses
     */
    public async GetAddresses(device: Device, paths: Array<Array<number>>): Promise<Array<ProkeyResponses.RippleAddress>> {
        if (device == null || paths == null) {
            return Promise.reject({
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM
            });
        }

        let lstAddress = new Array<ProkeyResponses.RippleAddress>();

        paths.forEach(async (path) => {
            let pn: Array<number>;
            if (typeof path == "string") {
                try {
                    pn = PathUtil.getHDPath(path);
                }
                catch (e) {
                    return Promise.reject({ success: false, errorCode: GeneralErrors.PATH_NOT_VALID });
                }
            }
            else {
                pn = path;
            }

            let param = {
                address_n: pn,
                show_display: false,
            }

            try {
                let address = await device.SendMessage<ProkeyResponses.RippleAddress>('RippleGetAddress', param, 'RippleAddress');
                lstAddress.push(address);
            } catch (e) {
                Promise.reject(e);
            }
        });

        return lstAddress;
    }

    /**
     * Get Public key
     * @param device The prokey device
     * @param path BIP path
     * @param showOnProkey true means show the public key on prokey display
     */
    public async GetPublicKey(device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean): Promise<ProkeyResponses.PublicKey> {

        if (device == null || path == null) {
            return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
        }

        let showDisplay = (showOnProkey == null) ? true : showOnProkey;

        // convert path to array of num
        let address_n: Array<number>;
        if (typeof path == "string") {
            try {
                address_n = PathUtil.getHDPath(path);
            }
            catch (e) {
                return Promise.reject({ success: false, errorCode: GeneralErrors.PATH_NOT_VALID });
            }

        } else {
            address_n = path;
        }

        let param = {
            address_n: address_n,
            show_display: showDisplay,
        }

        return await device.SendMessage<ProkeyResponses.PublicKey>('GetPublicKey', param, 'PublicKey');
    }

    /**
     * sign a transaction
     * @param device Prokey device instance
     * @param transaction transaction to be signed 
     */
    public async SignTransaction(device: Device, transaction: RippleTransaction): Promise<ProkeyResponses.RippleSignedTx> {
        MyConsole.Info("RippleSignTx", transaction);
        if (!device) {
            let e: GeneralResponse = {
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM,
                errorMessage: "RippleCommands::SignTransaction->parameter Device cannot be null",
            }

            throw e;
        }

        if (!transaction) {
            let e: GeneralResponse = {
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM,
                errorMessage: "RippleCommands::SignTransaction->parameter transaction cannot be null",
            }

            throw e;
        }

        if (!transaction.payment) {
            let e: GeneralResponse = {
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM,
                errorMessage: "RippleCommands::SignTransaction->parameter transaction.payment cannot be null",
            }

            throw e;
        }

        return new Promise<ProkeyResponses.RippleSignedTx>(async (resolve, reject) => {
            var OnFailure = (reason: any) => {
                device.RemoveOnFailureCallBack(OnFailure);

                reject(`Signing transaction failed: ${reason.message}`);
            };

            // Validate the parameters
            try {
                validateParams(transaction, [
                    { name: "address_n", type: "array", obligatory: true },
                    { name: "fee", type: "number", obligatory: true },
                    { name: "flags", type: "number" },
                    { name: "sequence", type: "number", obligatory: true },
                    { name: "last_ledger_sequence", type: "number" },
                ]);

                validateParams(transaction.payment, [
                    { name: "amount", type: "number", obligatory: true },
                    { name: "destination", type: "string", obligatory: true },
                    { name: "destination_tag", type: "number" }
                ]);
            }
            catch (ex) {
                MyConsole.Info(ex);
                return reject(ex);
            }

            resolve(await device.SendMessage<ProkeyResponses.RippleSignedTx>('RippleSignTx', transaction, 'RippleSignedTx'));
        });
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
        coin?: string): Promise<ProkeyResponses.MessageSignature> {

        let scriptType = PathUtil.GetScriptType(address_n);

        let res = await device.SendMessage<ProkeyResponses.MessageSignature>('SignMessage', {
            address_n: address_n,
            message: message,
            coin_name: coin || 'Ripple',
            script_type: scriptType,
        }, 'MessageSignature');

        if (res.signature) {
            res.signature = Utility.ByteArrayToHexString(res.signature);
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
        coinName: string): Promise<ProkeyResponses.Success> {

        return await device.SendMessage<ProkeyResponses.Success>('VerifyMessage', {
            address: address,
            signature: signature,
            message: message,
            coin_name: coinName || 'Ripple',
        }, 'Success');
    }

}