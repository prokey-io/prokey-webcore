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
import * as Utility from '../utils/utils';
import { Device } from './Device';
import { GeneralResponse, GeneralErrors } from '../models/GeneralResponse';
import { ICoinCommands } from './ICoinCommand';
import { BitcoinTx, BitcoinSignTxParams } from '../models/BitcoinTx';
import { validateParams } from '../utils/paramsValidator';
import { MyConsole } from '../utils/console';
import { BitcoinBaseCoinInfoModel, OmniCoinInfoModel } from '../models/CoinInfoModel'
import { CoinInfo, CoinBaseType } from '../coins/CoinInfo';
import BigNumber from 'bignumber.js';

export class BitcoinCommands implements ICoinCommands {
    _bitcoinTx!: BitcoinTx;
    _signatures: Array<string> = [];
    _serializedTx: string = '';
    _isSigning: boolean = false;
    _failedSignHandler: any;
    private _coinInfo: BitcoinBaseCoinInfoModel | OmniCoinInfoModel;

    constructor(coinNameOrShortcut: string = "Bitcoin", isOmni = false) {

        if(isOmni == false) {
            this._coinInfo = CoinInfo.Get<BitcoinBaseCoinInfoModel>(coinNameOrShortcut, CoinBaseType.BitcoinBase );
        } else {
            this._coinInfo = CoinInfo.Get<OmniCoinInfoModel>(coinNameOrShortcut, CoinBaseType.OMNI );
        }


        if(this._coinInfo == null)
        {
            throw new Error(`Cannot load CoinInfo for ${coinNameOrShortcut}`);
        }
    }
    
    /**
     * Get Bitcoin/Litecoin and etc address
     * @param device Prokey device instance
     * @param path BIP path 
     * @param showOnProkey true means show the address on device display
     */
    public async GetAddress(device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean): Promise<ProkeyResponses.AddressModel> {

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

        const scriptType = PathUtil.IsSegwitPath(address_n) ? ProkeyResponses.EnumInputScriptType.SPENDP2SHWITNESS : ProkeyResponses.EnumInputScriptType.SPENDADDRESS;

        let param = {
            address_n: address_n,
            coin_name: this._coinInfo.on_device || this._coinInfo.name || 'Bitcoin',
            show_display: showDisplay,
            script_type: scriptType,
        }

        let res = await device.SendMessage<ProkeyResponses.AddressModel>('GetAddress', param, 'Address');

        return {
            address: res.address,
            path: address_n,
        };
    }
    
    /**
     * Get List of addresses, This function is useful in account discovery
     * @param device the prokey device instance
     * @param paths list of paths to retrive the addresses
     */
    public async GetAddresses(device: Device,
        paths: Array<Array<number> | string>): Promise<Array<ProkeyResponses.AddressModel>> {

        if (device == null || paths == null) {
            return Promise.reject({ success: false, errorCode: GeneralErrors.INVALID_PARAM });
        }

        let lstAddress: Array<ProkeyResponses.AddressModel> = new Array<ProkeyResponses.AddressModel>();
        let lstPathN: Array<Array<number>> = new Array<Array<number>>();
        let lstScriptType: Array<ProkeyResponses.EnumInputScriptType> = new Array<ProkeyResponses.EnumInputScriptType>();

        // convert path to array of num
        paths.forEach(async (path) => 
        {
            let pn: Array<number>;
            if(typeof path == "string") {
                try {
                    pn = PathUtil.getHDPath(path);
                }
                catch (e) {
                    return { success: false, errorCode: GeneralErrors.PATH_NOT_VALID }
                }
            } 
            else {
                pn = path;
            }

            // prepare list of paths
            lstPathN.push(pn);

            // prepare list of Input Script Types
            lstScriptType.push(PathUtil.IsSegwitPath(pn) ? ProkeyResponses.EnumInputScriptType.SPENDP2SHWITNESS : ProkeyResponses.EnumInputScriptType.SPENDADDRESS);
        });
        
        let i=0;

        for(i=0; i<lstPathN.length; i++){
            let param = {
                address_n: lstPathN[i],
                coin_name: this._coinInfo.on_device || this._coinInfo.name || 'Bitcoin',
                show_display: false,
                script_type: lstScriptType[i],
            }

            try{
                // Getting address from device
                let res = await device.SendMessage<ProkeyResponses.AddressModel>('GetAddress', param, 'Address');

                // Generate address model
                lstAddress.push({
                    address: res.address,
                    path: lstPathN[i],
                });

            }
            catch(e) {
                Promise.reject(e);
            }
        }

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

        //! Get the script type
        //! Default or BIP44 => SPENDADDRESS
        //! BIP49 => SPENDP2SHWITNESS
        let scriptType = PathUtil.GetScriptType(address_n);

        let param = {
            address_n: address_n,
            show_display: showDisplay,
            script_type: scriptType,
        }

        return await device.SendMessage<ProkeyResponses.PublicKey>('GetPublicKey', param, 'PublicKey');
    }
    
    /**
     * sign a transaction
     * @param device Prokey device instance
     * @param bitcoinTransaction transaction to be signed 
     */
    public async SignTransaction(device: Device, bitcoinTransaction: BitcoinTx): Promise<ProkeyResponses.SignedTx> {

        console.log("SignTransaction", bitcoinTransaction);
        if(!device) {
            let e: GeneralResponse = {
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM,
                errorMessage: "BitcoinCommands::SignTransaction->parameter Device cannot be null",
            }

            throw e;
        }

        if(!bitcoinTransaction) {
            let e: GeneralResponse = {
                success: false,
                errorCode: GeneralErrors.INVALID_PARAM,
                errorMessage: "BitcoinCommands::SignTransaction->parameter bitcoinTransaction cannot be null",
            }
            
            throw e;
        }

        // reject if already in signing
        if(this._isSigning) {
            let e: GeneralResponse = {
                success: false,
                errorCode: GeneralErrors.BUSY,
                errorMessage: "BitcoinCommands::SignTransaction->Already in signig",
            }
            
            throw e;
        }

        this._serializedTx = '';
        this._signatures = [];

        return new Promise<ProkeyResponses.SignedTx>(async (resolve, reject) => {

            this._isSigning = true;

            this._failedSignHandler = (reason: any) => {
                // "this" can be null if the user after signing a transaction, change the coin 
                if(this != undefined)
                    this._isSigning = false;

                device.RemoveOnFailureCallBack(this._failedSignHandler);

                /*let e: GeneralResponse = {
                    success: false,
                    errorCode: GeneralErrors.SIGNING_FAILED,
                    errorMessage: `BitcoinCommands::SignTransaction->${reason}`,
                }*/

                reject(`Signing transaction failed: ${reason.message}`);
            };

            // Validate the parameters
            try {
                // TODO: This validator needs test
                validateParams(bitcoinTransaction, [
                    { name: 'coinName', type: 'string', obligatory: true },
                    { name: 'inputs', type: 'array', obligatory: true },
                    { name: 'outputs', type: 'array', obligatory: true },
                    { name: 'refTxs', type: 'array', allowEmpty: true },
                    { name: 'locktime', type: 'number' },
                    { name: 'timestamp', type: 'number' },
                    { name: 'version', type: 'number' },
                    { name: 'expiry', type: 'number' },
                    { name: 'overwintered', type: 'boolean' },
                    { name: 'versionGroupId', type: 'number' },
                    { name: 'branchId', type: 'number' },
                ]);


                //! If there is refTxs, Validate it
                // TODO: This validator needs test
                if (Object.prototype.hasOwnProperty.call(bitcoinTransaction, 'refTxs')) {
                    if(bitcoinTransaction.refTxs){
                        bitcoinTransaction.refTxs.forEach(tx => {
                            validateParams(tx, [
                                { name: 'hash', type: 'string', obligatory: true },
                                { name: 'inputs', type: 'array', obligatory: true },
                                { name: 'bin_outputs', type: 'array', obligatory: true },
                                { name: 'version', type: 'number', obligatory: true },
                                { name: 'lock_time', type: 'number', obligatory: true },
                                { name: 'extra_data', type: 'string' },
                                { name: 'timestamp', type: 'number' },
                                { name: 'version_group_id', type: 'number' },
                            ]);
                        });
                    }
                }

                //! Validate the inputs
                // TODO: This validator needs test
                // TODO: Validate multisig
                for (const input of bitcoinTransaction.inputs) {
                    PathUtil.validatePath(input.address_n);
                    const useAmount = PathUtil.IsSegwitPath(input.address_n);
                    input.script_type = ProkeyResponses.EnumInputScriptType.SPENDADDRESS;
                    if(useAmount){
                        input.script_type = ProkeyResponses.EnumInputScriptType.SPENDP2SHWITNESS;
                    }
                    validateParams(input, [
                        { name: 'prev_hash', type: 'string', obligatory: true },
                        { name: 'prev_index', type: 'number', obligatory: true },
                        //{ name: 'script_type', type: 'string' },
                        { name: 'amount', type: 'string', obligatory: useAmount },
                        { name: 'sequence', type: 'number' },
                        { name: 'multisig', type: 'object' },
                    ]);
                }


                let totalOutputAmount : BigNumber = new BigNumber(0);
                //! Validate outputs
                for (const output of bitcoinTransaction.outputs) {
                    validateParams(output, [
                        { name: 'address_n', type: 'array' },
                        { name: 'address', type: 'string' },
                        { name: 'amount', type: 'string' },
                        { name: 'op_return_data', type: 'array' },
                        { name: 'multisig', type: 'object' },
                    ]);

                    if (Object.prototype.hasOwnProperty.call(output, 'address_n') && Object.prototype.hasOwnProperty.call(output, 'address')) {
                        let e: GeneralResponse = {
                            success: false,
                            errorCode: GeneralErrors.INVALID_PARAM,
                            errorMessage: 'Cannot use address and address_n in one output',
                        }
                        throw e;
                    }

                    // If there is amout in output, we need to check if it's less than dust_limit
                    // now we sum all output's amount
                    if(Object.prototype.hasOwnProperty.call(output, 'amount') && !Object.prototype.hasOwnProperty.call(output, 'op_return_data')) {
                        totalOutputAmount = totalOutputAmount.plus(typeof output.amount === 'string' ? output.amount : '0');
                    }


                    // TODO Validate output address
                    // if (output.hasOwnProperty("address_n")) {
                    //     const scriptType = PathUtil.getOutputScriptType(output.address_n);
                    //     if (output.script_type !== scriptType){
                    //         let e: GeneralResponse = {
                    //             success: false,
                    //             errorCode: GeneralErrors.INVALID_PARAM,
                    //             errorMessage: `Output change script_type should be set to ${scriptType}`,
                    //         }
                    //         throw e;
                    //     }
                    // }

                    // if (typeof output.address === 'string' && isValidAddress(output.address, coinInfo)) {
                    //     // validate address with coin info
                    //     let e: GeneralResponse = {
                    //         success: false,
                    //         errorCode: GeneralErrors.INVALID_PARAM,
                    //         errorMessage: `Invalid output address ${ output.address }`,
                    //     }
                    //     throw e;
                    // }
                }

                
                // Total output amount should be more than coin dust limit
                if( totalOutputAmount.lte(this._coinInfo.dust_limit)){
                    let e : GeneralResponse = {
                        success: false,
                        errorCode: GeneralErrors.INVALID_PARAM,
                        errorMessage: `The total output is less than coin dust ${this._coinInfo.dust_limit}`,
                    }

                    throw e;
                }

            }
            catch (ex) {
                MyConsole.Info(ex);
                this._isSigning = false;
                return reject(ex);
            }

            // keep transaction
            this._bitcoinTx = bitcoinTransaction;

            // CPC, PPC and tPPC need timestamp
            let shortcut = this._coinInfo.shortcut;
            if ((shortcut === 'CPC' || shortcut === 'PPC' || shortcut === 'tPPC') && !Object.prototype.hasOwnProperty.call(bitcoinTransaction, 'timestamp')) {
                const d = new Date();

                bitcoinTransaction.options.timestamp = Math.round(d.getTime() / 1000);
            }

            // build a dictionary of RefTx
            const dicRefTx: { [key: string]: ProkeyResponses.RefTransaction } = {};
            if (bitcoinTransaction.refTxs != null) {
                bitcoinTransaction.refTxs.forEach((tx: ProkeyResponses.RefTransaction) => {
                    dicRefTx[tx.hash.toLowerCase()] = tx;
                });
            }

            let param : BitcoinSignTxParams = {
                outputs_count: bitcoinTransaction.outputs.length,
                inputs_count: bitcoinTransaction.inputs.length,
                coin_name: bitcoinTransaction.coinName,
                ...bitcoinTransaction.options,
            }

            MyConsole.Info(param);
        
            try{
                device.AddOnFailureCallBack(this._failedSignHandler);
                let txReq = await device.SendMessage<ProkeyResponses.TxRequest>('SignTx', param, 'TxRequest');
                await this.TxReqHandler(device, dicRefTx, txReq, resolve, reject);
            }catch(e){
                this._isSigning = false;
                reject(e);
            }
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
            coin_name: coin || 'Bitcoin',
            script_type: scriptType,
        },'MessageSignature');

        if(res.signature){
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
            coin_name: coinName || 'Bitcoin',
        } ,'Success');
    }

    // **********************************
    // PRIVATE FUNCTIONS
    // Signing transaction helpers
    // **********************************
    private RequesCurrentTxInfo(
        reqType: ProkeyResponses.eRequestType,
        reqIndex: number | string): any {
        //! request_index is used for input/output requested index
        const i = +reqIndex;

        //! the request should not be TXMETA or TXEXTRADATA
        if (reqType == ProkeyResponses.eRequestType.TXMETA || reqType == ProkeyResponses.eRequestType.TXEXTRADATA) {
            throw new Error(`Cannot read ${reqType} from signed transaction`);
        }

        if (reqType == ProkeyResponses.eRequestType.TXINPUT) {

            //! The prev_hash needs some modifications
            let inp: any = this._bitcoinTx.inputs[i];

            if (typeof (inp.prev_hash) == 'string') {
                //! The device needs prev_hash as byteArray
                inp.prev_hash = Utility.HexStringToByteArray(inp.prev_hash);
            }

            //! The prev_hash to device should be reversed
            inp.prev_hash = Utility.ReverseByteArray(inp.prev_hash);

            return { inputs: [inp] };
        }
        else if (reqType == ProkeyResponses.eRequestType.TXOUTPUT) {
            return { outputs: [this._bitcoinTx.outputs[i]] };
        }

        throw new Error(`Unknown request type: ${reqType}`);
    }
    
    private RequestPrevTxInfo(
        reqTx: ProkeyResponses.RefTransaction,
        requestType: ProkeyResponses.eRequestType,
        requestIndex: string | number,
        dataLen?: (string | number),
        dataOffset?: (string | number)): any {

        const i = +requestIndex;
        if (requestType == ProkeyResponses.eRequestType.TXINPUT) {
            //! The hash needs some modifications
            let inp: any = reqTx.inputs[i];

            //! The device needs prev_hash as byteArray
            inp.prev_hash = Utility.HexStringToByteArray(inp.prev_hash);

            //! The prev_hash to device should be reversed
            inp.prev_hash = Utility.ReverseByteArray(inp.prev_hash);

            inp.script_sig = Utility.HexStringToByteArray(inp.script_sig);

            return { inputs: [inp] };
        }

        if (requestType == ProkeyResponses.eRequestType.TXOUTPUT) {
            let out: any = reqTx.bin_outputs[i];

            out.script_pubkey = Utility.HexStringToByteArray(out.script_pubkey);
            return { bin_outputs: [out] };
        }

        if (requestType == ProkeyResponses.eRequestType.TXEXTRADATA) {
            if (dataLen == null) {
                throw new Error('Missing extra_data_len');
            }
            const dataLenN: number = +dataLen;

            if (dataOffset == null) {
                throw new Error('Missing extra_data_offset');
            }
            const dataOffsetN: number = +dataOffset;

            if (reqTx.extra_data == null) {
                throw new Error('No extra data for transaction ' + reqTx.hash);
            }

            const data: string = reqTx.extra_data;
            const substring = data.substring(dataOffsetN * 2, (dataOffsetN + dataLenN) * 2);
            return { extra_data: substring };
        }

        if (requestType == ProkeyResponses.eRequestType.TXMETA) {
            const outputCount = reqTx.bin_outputs.length;
            const data: string | undefined = reqTx.extra_data;
            const meta = {
                version: reqTx.version,
                lock_time: reqTx.lock_time,
                inputs_cnt: reqTx.inputs.length,
                outputs_cnt: outputCount,
                timestamp: reqTx.timestamp,
                version_group_id: reqTx.version_group_id,
            };

            if (typeof data === 'string' && data.length !== 0) {
                return {
                    ...meta,
                    extra_data_len: data.length / 2,
                };
            }

            return meta;
        }
        throw new Error(`Unknown request type: ${requestType}`);
    }
    
    private RequestTxInfo(
        req: ProkeyResponses.TxRequest,
        dicRefTx: { [hash: string]: ProkeyResponses.RefTransaction },
    ): any {
        // Device needs previous transaction info
        if (req.details.tx_hash && req.details.tx_hash.length > 0) {
            let requestedHashInString: string = Utility.ByteArrayToHexString(req.details.tx_hash);
            const reqTx = dicRefTx[requestedHashInString];
            if (reqTx == null) {
                throw new Error(`Unknown tx: ${req.details.tx_hash} requested`);
            }

            return this.RequestPrevTxInfo(
                reqTx,
                req.request_type,
                req.details.request_index,
                req.details.extra_data_len,
                req.details.extra_data_offset
            )
        } else { // Device needs current transaction info
            return this.RequesCurrentTxInfo(
                req.request_type,
                req.details.request_index,
            )
        }

    }
    
    private SaveTxSignatures(txReq: ProkeyResponses.TxRequestSerialized): void {
        if (txReq.serialized_tx != null) {
            if (this._serializedTx.length != 0) {
                this._serializedTx += ',';
            }
            this._serializedTx += txReq.serialized_tx;
        }
        if (txReq.signature_index != null) {
            if (txReq.signature == null) {
                throw new Error('Unexpected null in signature.');
            }

            if (txReq.signature.length > 0)
                this._signatures[txReq.signature_index] = txReq.signature;
        }
    };
    
    private async TxReqHandler(
        device: Device,
        dicRefTx: { [key: string]: ProkeyResponses.RefTransaction },
        txReq: ProkeyResponses.TxRequest,
        resolve: any,
        reject: any, ): Promise<GeneralResponse> {

        MyConsole.Info("BitcoinCommands::TxReqHandler->Request", txReq);

        // Save signature and serialized transaction
        if (txReq.serialized != null) {
            this.SaveTxSignatures(txReq.serialized);
        }

        //! If siging finished, Callback function will be called
        // and the serialized data will be passed to it
        if (txReq.request_type == ProkeyResponses.eRequestType.TXFINISHED) {
            this._isSigning = false;
            device.RemoveOnFailureCallBack(this._failedSignHandler);
            resolve({
                serialized_tx: Utility.DecimalStrigArrayToHexString(this._serializedTx, ','),
                signatures: this._signatures,
            });
            return { success: true };
        }

        //! Device needs more data about current/previous transaction(s)
        try {
            
            //! Prepare the answer
            const resTx = this.RequestTxInfo(txReq, dicRefTx);

            //! Log the response
            MyConsole.Info("BitcoinCommands::LogAck->Ack", resTx);

            //! Send the answer to deivce
            const res = await device.SendMessage<ProkeyResponses.TxRequest>('TxAck', { tx: resTx }, 'TxRequest')
            //! Check device response
            return await this.TxReqHandler(device, dicRefTx, res, resolve, reject);
        }
        catch (ex) {
            if (ex instanceof Error) {
                this._isSigning = false;
                device.RemoveOnFailureCallBack(this._failedSignHandler);
                return reject({
                    success: false,
                    errorCode: GeneralErrors.UNKNOWN,
                    errorMessage: ex.message,
                })
            }
            return {
                success: false,
                errorCode: GeneralErrors.UNKNOWN,
            };
        }
    }
}
