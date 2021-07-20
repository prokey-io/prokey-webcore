/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
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

import { Device } from "./Device";
import * as PathUtil from '../utils/pathUtils';
import * as Utility from '../utils/utils';
import { GeneralErrors } from "../models/GeneralResponse";
import { MessageSignature, PublicKey, Success } from "../models/Prokey";

export abstract class BaseCommands {

    /**
    * Get coin address from device
    * @param device Prokey device instance
    * @param path BIP path 
    * @param showOnProkey true means show the address on device display
    */
    protected async GetAddressBase<AddressType>(
        deviceCommand: string,
        returnType: string,
        device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean): Promise<AddressType> {
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

        return await device.SendMessage<AddressType>(deviceCommand, param, returnType);
    }

    /**
     * Get List of addresses, This function is useful in account discovery
     * @param device the prokey device instance
     * @param paths list of paths to retrive the addresses
     */
    protected async GetAddressesBase<AddressType>(
        deviceCommand: string,
        returnType: string,
        device: Device,
        paths: Array<Array<number>>): Promise<Array<AddressType>> {

        if (device == null || paths == null) {
            return Promise.reject({
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM
            });
        }

        let lstAddress = new Array<AddressType>();
        lstAddress.length = paths.length;

        paths.forEach(async (path) => {
            lstAddress.push(await this.GetAddressBase(
                deviceCommand,
                returnType,
                device,
                path,
                false));
        });

        return lstAddress;
    }

    /**
     * Get Public key
     * @param device The prokey device
     * @param path BIP path
     * @param showOnProkey true means show the public key on prokey display
     */
    protected async GetPublicKeyBase(device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean): Promise<PublicKey> {

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

        return await device.SendMessage<PublicKey>('GetPublicKey', param, 'PublicKey');
    }

    /**
     * Sign Message
     * @param device Prokey device instance
     * @param address_n array of BIP32/44 Path
     * @param message message to be signed
     * @param coin coin name
     */
    protected async SignMessageBase(
        device: Device,
        address_n: Array<number>,
        message: Uint8Array,
        coin: string): Promise<MessageSignature> {

        let scriptType = PathUtil.GetScriptType(address_n);

        let res = await device.SendMessage<MessageSignature>('SignMessage', {
            address_n: address_n,
            message: message,
            coin_name: coin,
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
    public async VerifyMessageBase(
        device: Device,
        address: string,
        message: Uint8Array,
        signature: Uint8Array,
        coinName: string): Promise<Success> {

        return await device.SendMessage<Success>('VerifyMessage', {
            address: address,
            signature: signature,
            message: message,
            coin_name: coinName,
        }, 'Success');
    }
}