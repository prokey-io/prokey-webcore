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

import * as ProkeyResponses from '../models/Prokey';
import * as PathUtil from '../utils/pathUtils';
import * as Util from '../utils/utils'
import { getHDPath } from '../utils/pathUtils';
import { Device } from './Device';
import { GeneralResponse, GeneralErrors } from '../models/GeneralResponse';
import { ICoinCommands } from './ICoinCommand';
import { EthereumTx, EthTxToProkey } from '../models/EthereumTx';
import { validateParams } from '../utils/paramsValidator';
import { EthereumBaseCoinInfoModel } from '../models/CoinInfoModel';
import { CoinInfo, CoinBaseType } from '../coins/CoinInfo';

export class EthereumCommands implements ICoinCommands {

    _isSigning = false;
    private _coinInfo : EthereumBaseCoinInfoModel;

    constructor(coinNameOrcontractAddress: string = "Ethereum", isErc20 = false) {
        this._coinInfo = CoinInfo.Get<EthereumBaseCoinInfoModel>(coinNameOrcontractAddress, (isErc20 == true) ? CoinBaseType.ERC20 : CoinBaseType.EthereumBase);
        if (isErc20) {
            const ethCoinInfo = CoinInfo.Get<EthereumBaseCoinInfoModel>('Ethereum', CoinBaseType.EthereumBase);
            if (ethCoinInfo) {
                this._coinInfo.tx_url = ethCoinInfo.tx_url;
            }
        }
        if(this._coinInfo == null)
        {
            throw new Error(`Cannot load CoinInfo for ${coinNameOrcontractAddress}`);
        }
    }

    /**
     * Get Coin Info
     */
    public GetCoinInfo() : EthereumBaseCoinInfoModel {
       return this._coinInfo;
    }
    
    /**
     * Get Bitcoin/Litecoin and etc address
     * @param device Prokey device instance
     * @param path BIP path 
     * @param showOnProkey true means show the address on device display
     */
    public async GetAddress(device: Device, path: Array<number>, showOnProkey?: boolean): Promise<ProkeyResponses.EthereumAddress> {

        if (device == null || path == null) {
            return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
        }

        let showDisplay = (showOnProkey == null) ? true : showOnProkey;

        // convert path to array of num
        let address_n: Array<number>;
        if (typeof path == "string") {
            try {
                address_n = getHDPath(path);
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

        return await device.SendMessage<ProkeyResponses.EthereumAddress>('EthereumGetAddress', param, 'EthereumAddress');
    }
    
    /**
     * Get List of addresses, This function is useful in account discovery
     * @param device the prokey device instance
     * @param paths list of paths to retrive the addresses
     */
    public async GetAddresses(device: Device, paths: Array<Array<number>>): Promise<Array<ProkeyResponses.EthereumAddress>> {
        if (device == null || paths == null) {
            return Promise.reject({ 
                success: false, 
                errorCode: GeneralErrors.INVALID_PARAM 
            });
        }

        let lstAddress: Array<ProkeyResponses.EthereumAddress> = new Array<ProkeyResponses.EthereumAddress>();

        paths.forEach(async (path) => 
        {
            let pn: Array<number>;
            if(typeof path == "string") {
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

            try{
                let address = await device.SendMessage<ProkeyResponses.EthereumAddress>('EthereumGetAddress', param, 'EthereumAddress');
                lstAddress.push(address);
            } catch(e) {
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
        path: string | Array<number>,
        showOnProkey?: boolean): Promise<ProkeyResponses.PublicKey> {
        if (device == null || path == null) {
            return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
        }

        let showDisplay = (showOnProkey == null) ? true : showOnProkey;

        // convert path to array of num
        let address_n: Array<number>;
        if (typeof path == "string") {
            try {
                address_n = getHDPath(path);
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

        return await device.SendMessage<ProkeyResponses.PublicKey>('EthereumGetPublicKey', param, 'EthereumPublicKey');
    }

    /**
     * Sign an ethereum transaction
     * @param device Prokey device instance
     * @param ethTx ETH transaction
     */
    public async SignTransaction(device: Device, ethTx: EthereumTx): Promise<ProkeyResponses.EthereumSignedTx> {

        if(!device)
            throw new Error("Ethereum::SignTransaction->parameter Device cannot be null");

        if(!ethTx)
            throw new Error("Ethereum::SignTransaction->parameter ethTx cannot be null");

        device.AddOnFailureCallBack((reason: string) => {
            // "this" can be null if the user after signing a transaction, change the coin 
            if(this != undefined)
                this._isSigning = false;
        });

        // reject if already in signing
        if(this._isSigning)
            return Promise.reject("Ethereum::SignTransaction->Already in signig");

        return new Promise<ProkeyResponses.EthereumSignedTx>(async (resolve,reject) => {
            // This var is using to reject new request until this one is begin resolved or rejected
            this._isSigning = true;

            // Validate the parameters
            try {
                validateParams(ethTx, [
                    { name: 'address_n', type: 'array', obligatory: true },
                    { name: 'to', type: 'string', obligatory: true },
                    { name: 'value', type: 'string', obligatory: true },
                    { name: 'gasLimit', type: 'string', obligatory: true },
                    { name: 'gasPrice', type: 'string', obligatory: true },
                    { name: 'nonce', type: 'string', obligatory: true },
                    { name: 'data', type: 'string' },
                    { name: 'chainId', type: 'number' },
                    { name: 'txType', type: 'number' },
                ]);

                // strip '0x' from values
                Object.keys(ethTx).map(key => {
                    if (typeof ethTx[key] === 'string') {
                        let value: string = Util.StripHexPrefix(ethTx[key]);
                        // pad left even
                        if (value.length % 2 !== 0) { value = '0' + value; }
                        // $FlowIssue
                        ethTx[key] = value;
                    }
                });
            }
            catch (ex) {
                this._isSigning = false;
                return reject(ex);
            }

            await this.signTx(device, ethTx, resolve, reject);

        });
    }

    /**
     * Sign Message
     * @param device Prokey device instance
     * @param address_n array of BIP32/44 Path
     * @param message message to be signed
     */
    public async SignMessage(device: Device, path: Array<number>, message: Uint8Array, coinName?: string): Promise<ProkeyResponses.MessageSignature> {
        let res = await device.SendMessage<ProkeyResponses.MessageSignature>('EthereumSignMessage', {
            address_n: path,
            message: message,
        }, 'EthereumMessageSignature');

        if(res.signature){
            res.signature = Util.ByteArrayToHexString(res.signature);
        }

        return res;
    }

    /**
     * Verify Message
     * @param device Prokey device instance
     * @param address address
     * @param signature signature data
     * @param message message
     * @param coinName
     */
     public async VerifyMessage(
        device: Device,
        address: string,
        message: Uint8Array,
        signature: Uint8Array): Promise<ProkeyResponses.Success> {

        return await device.SendMessage<ProkeyResponses.Success>('EthereumVerifyMessage', {
            address: address,
            signature: signature,
            message: message,
        },'Success');
    }

    // **********************************
    // PRIVATE FUNCTIONS
    // **********************************
    private async signTx (device: Device,
        ethTx: EthereumTx,
        resolve: any,
        reject: any): Promise<GeneralResponse> {

        const length = ethTx.data == null ? 0 : ethTx.data.length / 2;

        const [first, rest] = Util.SplitString(1024*2, ethTx.data);

        let message: EthTxToProkey = {
            address_n: ethTx.address_n,
            nonce:  Util.HexStringToByteArray(Util.StripLeadingZeroes(ethTx.nonce)),
            gas_price: Util.HexStringToByteArray(Util.StripLeadingZeroes(ethTx.gasPrice)),
            gas_limit: Util.HexStringToByteArray(Util.StripLeadingZeroes(ethTx.gasLimit)),
            to: ethTx.to,
            value: Util.HexStringToByteArray(Util.StripLeadingZeroes(ethTx.value)),
        };

        if (length !== 0) {
            message = {
                ...message,
                data_length: length,
                data_initial_chunk: Util.HexStringToByteArray(first),
            };
        }

        if (ethTx.chainId) {
            message = {
                ...message,
                chain_id: ethTx.chainId,
            };
        }

        if (ethTx.txType) {
            message = {
                ...message,
                tx_type: ethTx.txType,
            };
        }

        try
        {
            let res = await device.SendMessage<ProkeyResponses.EthereumTxRequest>( 'EthereumSignTx', message, 'EthereumTxRequest' );

            return await this.TxReqHandler(
                device,
                res,
                resolve,
                reject,
                rest,
                ethTx.chainId,
            );
        } catch(e) {
            this._isSigning = false;
            return reject(e);
        }
    }

    
    private async TxReqHandler( device: Device,
        request: ProkeyResponses.EthereumTxRequest,
        resolve: any,
        reject: any,
        data?: string,
        chain_id?: number): Promise<GeneralResponse> {

        if (!request.data_length) {
            let v: number | undefined = request.signature_v;
            const r = request.signature_r;
            const s = request.signature_s;
            if (v == null || r == null || s == null) {
                var e: GeneralResponse = {
                    success: false,
                    errorMessage: 'Unexpected request.',
                }
                this._isSigning = false;
                return reject(e);
            }
    
            // recompute "v" value
            if (v && chain_id && v <= 1) {
                v += 2 * chain_id + 35;
            }

            if(v) {
                resolve(
                    {
                        v: '0x' + v.toString(16),
                        r: '0x' + Util.ByteArrayToHexString(r),
                        s: '0x' + Util.ByteArrayToHexString(s),
                    })
            } else {
                resolve(
                    {
                        r: '0x' + r,
                        s: '0x' + s,
                    })
            };

            // can accept new siging command
            this._isSigning = false;

            return {
                success: true,
            };
        }

        const [first, rest] = Util.SplitString(request.data_length * 2, data);

        try{
            let res = await device.SendMessage<ProkeyResponses.EthereumTxRequest>( 'EthereumTxAck', { data_chunk: first }, 'EthereumTxRequest' );
            return await this.TxReqHandler(
                device,
                res,
                resolve,
                reject,
                rest,
                chain_id);
        } catch(e) {
            this._isSigning = false;
            return reject(e);
        }
    }
}