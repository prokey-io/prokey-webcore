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
import { RippleTransaction } from '../models/Prokey';
import { MyConsole } from '../utils/console';
import { validateParams } from '../utils/paramsValidator';
import { BaseCommands } from './BaseCommands';

export class RippleCommands extends BaseCommands implements ICoinCommands {

    private _coinInfo: RippleCoinInfoModel;
    _failedSignHandler: any;

    constructor(coinName: string) {
        super();
        this._coinInfo = CoinInfo.Get<RippleCoinInfoModel>(coinName, CoinBaseType.Ripple);
        if (this._coinInfo == null) {
            throw new Error(`Cannot load CoinInfo for ${coinName}`);
        }
    }

    /**
     * Get Coin Info
     */
    public GetCoinInfo(): RippleCoinInfoModel {
        return this._coinInfo;
    }

    /**
    * Get Bitcoin/Litecoin and etc address
    * @param device Prokey device instance
    * @param path BIP path 
    * @param showOnProkey true means show the address on device display
    */
    public async GetAddress(device: Device, path: Array<number>, showOnProkey?: boolean): Promise<ProkeyResponses.RippleAddress> {
        return await this.GetAddressBase<ProkeyResponses.RippleAddress>('RippleGetAddress', 'RippleAddress', device, path, showOnProkey);
    }

    /**
     * Get List of addresses, This function is useful in account discovery
     * @param device the prokey device instance
     * @param paths list of paths to retrive the addresses
     */
    public async GetAddresses(device: Device, paths: Array<Array<number>>): Promise<Array<ProkeyResponses.RippleAddress>> {
        return await this.GetAddressesBase<ProkeyResponses.RippleAddress>('RippleGetAddress', 'RippleAddress', device, paths);
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

            return await this.GetPublicKeyBase(device, path, showOnProkey);
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
            this._failedSignHandler = (reason: any) => {
                device.RemoveOnFailureCallBack(this._failedSignHandler);

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
                device.RemoveOnFailureCallBack(this._failedSignHandler);
                return reject(ex);
            }

            device.AddOnFailureCallBack(this._failedSignHandler);
            let res = await device.SendMessage<ProkeyResponses.RippleSignedTx>('RippleSignTx', transaction, 'RippleSignedTx');
            device.RemoveOnFailureCallBack(this._failedSignHandler);
            resolve(res);
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

        return await this.SignMessageBase(device, address_n, message, coin || 'Ripple');
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

        return await this.VerifyMessageBase(device, address, message, signature, coinName || 'Ripple');
    }

}