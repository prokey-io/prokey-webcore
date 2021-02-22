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

import { MyConsole } from '../utils/console';
import { Protobuf } from '../protobuf/Protobuf';
import * as ProkeyResponses from '../models/Prokey';
import { ITransport } from '../transport/ITransport';
import { WebUsb } from '../transport/WebUsb';
import { IMessagePayload } from '../transport/ITransport';
import * as PathUtil from '../utils/pathUtils';
import * as Util from '../utils/utils';
import { GeneralResponse, GeneralErrors } from '../models/GeneralResponse';
import { EventEmitter } from 'events' 


export class Device {
    private pb: Protobuf;
    private _passphraseTemporaryState?: string;
    private _transport!: ITransport;
    private _sendMessageResolve: any;
    private _sendMessageReject: any;
    private _sendMessageExpectedResponseType: string = "";

    _eventEmitters = new EventEmitter();

    /**
     * 
     * @param callback this is an optional call back showing if protobuf successfully initialized
     */
    constructor(callback?: (success: boolean) => void) {
        this.pb = Protobuf.Instance;
        if (!this.pb.IsInited) {
            this.pb.Init((isSuccess: boolean) => {
                if(callback) {
                    callback(isSuccess);
                }
            });
        } else if(callback) {
            callback(true);
        }
    }

    // ********************************************************
    // Registering Events
    // ********************************************************
    /**
     * Register a callback function to handle Device Button Request 
     * @param fn Call back function to serve Device Button Request
     */
    public AddOnButtonRequestCallBack( fn: (buttonRequestType: string) => void )  {
        this._eventEmitters.addListener('OnButtonRequest', fn);
    }

    /**
     * Remove Device Button Request handler
     * @param fn Call back function to serve Device Button Request
     */
    public RemoveOnButtonRequestCallBack( fn: (buttonRequestType: string) => void ) {
        this._eventEmitters.removeListener('OnButtonRequest', fn)
    }

    /**
     * Register a callback function to handle Failure situations
     * @param fn Call back function to handle Failure situations
     */
    public AddOnFailureCallBack( fn: (reason: any) => void ) {
        this._eventEmitters.addListener('OnFailure', fn);
    }

    /**
     * Remove On Failure handler
     * @param fn Call back function
     */
    public RemoveOnFailureCallBack( fn: (reason: any) => void ) {
        this._eventEmitters.removeListener('OnFailure', fn)
    }

    /**
     * Register a callback function to handle Pin Matrix Request
     * @param fn Call back function to handle Pin Matrix Request
     */
    public AddOnPinMatrixRequestCallBack( fn: (pinMatrixRequestType: string) => void ) {
        this._eventEmitters.addListener('OnPinMatrixRequest', fn);
    }

    /**
     * Remove Pin Matrix Request handler
     * @param fn Call back function
     */
    public RemoveOnPinMatrixRequestCallBack( fn: (pinMatrixRequestType: string) => void ) {
        this._eventEmitters.removeListener('OnPinMatrixRequest', fn)
    }

    /**
     * Register a callback function to handle Passpharase Request
     * @param fn Call back function to handle Passpharase Request
     */
    public AddOnPasspharaseRequestCallBack( fn: () => void ) {
        this._eventEmitters.addListener('OnPasspharaseRequest', fn);
    }

    /**
     * Remove Passpharase Request handler
     * @param fn Call back function
     */
    public RemoveOnPasspharaseRequestCallBack( fn: () => void ) {
        this._eventEmitters.removeListener('OnPasspharaseRequest', fn)
    }

    /**
     * Register a callback function to handle Word Request
     * @param fn Call back function to handle Word Request
     */
    public AddOnWordRequestCallBack( fn: () => void ) {
        this._eventEmitters.addListener('OnWordRequest', fn);
    }

    /**
     * Remove Word Request handler
     * @param fn Call back function
     */
    public RemoveOnWordRequestCallBack( fn: () => void ) {
        this._eventEmitters.removeListener('OnWordRequest', fn)
    }

    /**
     * Register a callback function to handle Device Disconnect
     * @param fn Call back function to handle Device Disconnect
     */
    public AddOnDeviceDisconnectCallBack( fn: () => void ) {
        this._eventEmitters.addListener('OnDeviceDisconnect', fn);
    }

    /**
     * Remove Device Disconnect handler
     * @param fn Call back function
     */
    public RemoveOnDeviceDisconnectCallBack( fn: () => void ) {
        this._eventEmitters.removeListener('OnDeviceDisconnect', fn)
    }

    /**
     * Initializing the Trabsport layer and up and running the webusb
     * This function MUST be called first before executing any function 
     */
    public async TransportConnect(): Promise<GeneralResponse> {
        this._transport = new WebUsb();

        let res = await this._transport.Init(true,
            // OnReceice call back
            (msgPayload: IMessagePayload) => {
                this.OnReceiveDataFromBridge(msgPayload);
            });

        this._transport.onDeviceDisconnect = () => {
            this._eventEmitters.emit('OnDeviceDisconnect');
        }

        if (res.success == false)
            return res;

        return await this._transport.Open();
    }

    /**
     * Reset device to default state and ask for device details
     */
    public async Initialize(){
        return await this.SendMessage<ProkeyResponses.Features>('Initialize', { state: null, skip_passphrase: false}, 'Features');
    }
    
    /**
     * Ping command
     * @param message Message to show on device or return on response
     * @param buttonReq Rise button request
     */
    public async Ping(message?: string, buttonReq?: boolean): Promise<ProkeyResponses.Success> {
        return await this.SendMessage<ProkeyResponses.Success>('Ping', {message: message, buttonProtection: buttonReq} , 'Success');
    }
    
    /**
     * Get device feature
     */
    public async GetFeatures(): Promise<ProkeyResponses.Features> {
        return await this.SendMessage<ProkeyResponses.Features>('GetFeatures', {}, 'Features');
    }
    
    /**
     * Request to change device pin
     * @param isRemove true: remove, false: change 
     */
    public async ChangePin(isRemove: boolean): Promise<ProkeyResponses.Success> {
        return await this.SendMessage<ProkeyResponses.Success>('ChangePin', {remove: isRemove}, 'Success');
    }
    
    /**
     * Change pin
     * @param label New label
     */
    public async ChangeLabel(label: string): Promise<ProkeyResponses.Success> {
        return await this.SendMessage<ProkeyResponses.Success>('ApplySettings', {label: label} , 'Success');
    }
    
    /**
     * Request to wipe device
     */
    public async WipeDevice(): Promise<ProkeyResponses.Success> {
        return await this.SendMessage<ProkeyResponses.Success>('WipeDevice', {}, 'Success');
    }
    
    /**
     * Request to create a wallet
     * @param skipBackUp Skip doing backup 
     * @param wordCount number of backup words
     */
    public async Reset(skipBackUp: Boolean, label?: string, wordCount?: number): Promise<ProkeyResponses.Success> {
        let wc = 0;
        if(wordCount == null || wordCount == 24) {
            wc = 256;
        }
        else if (wordCount == 12)  {
            wc = 128;
        } 
        else if (wordCount == 18) {
            wc = 192;
        }
        else {
            wc = 256;
        }

        return this.SendMessage<ProkeyResponses.Success>('ResetDevice', { strength: wc, skip_backup: skipBackUp, label: label}, 'Success');
    }
    
    /**
     * Start backup device after creating backup
     */
    public async Backup(): Promise<ProkeyResponses.Success> {
        return this.SendMessage<ProkeyResponses.Success>('BackupDevice', {}, 'Success');
    }
    
    /**
     * Enable passphrase
     */
    public async EnablePassphrase(): Promise<ProkeyResponses.Success> {
        return await this.SendMessage<ProkeyResponses.Success>('ApplySettings', {use_passphrase: true} , 'Success');
    }
    
    /**
     * Disable passphrase
     */
    public async DisablePassphrase(): Promise<ProkeyResponses.Success> {
        return await this.SendMessage<ProkeyResponses.Success>('ApplySettings', {use_passphrase: false} , 'Success');
    }
    
    /**
     * Sign Message
     * @param address_n array of BIP32/44 Path
     * @param message message to be signed
     * @param coin coin name
     */
    public async SignMessage( address_n: Array<number>, message: Uint8Array, coin?: string): Promise<ProkeyResponses.MessageSignature> {
        let res = await this.SendMessage<ProkeyResponses.MessageSignature>('SignMessage', {
            addressN: address_n,
            message,
            coinName: coin || 'Bitcoin',
            scriptType: PathUtil.IsSegwitPath(address_n) ? 'SPENDP2SHWITNESS' : undefined,
        },'MessageSignature');

        if(res.signature){
            res.signature = Util.ByteArrayToHexString(res.signature);
        }

        return res;
    }
    
    /**
     * Verify Message
     * @param address address
     * @param signature signature data
     * @param message message
     * @param coin coin name
     */
    public async VerifyMessage(
        address: string,
        signature: Uint8Array,
        message: Uint8Array,
        coin: string): Promise<ProkeyResponses.Success> {

        return await this.SendMessage<ProkeyResponses.Success>('VerifyMessage', {
            address,
            signature,
            message,
            coin,
        },'Success');
    }

    /**
     * Cancel the last command
     */
    public async Cancel(): Promise<GeneralResponse> {
        return await this.SendMessageByType('Cancel', {});
    }

    /**
     * To response to OnPinMatrixRequest, this function needs to be called
     * @param pin PinMatrix
     */
    public async PinMatrixAck(pin: string): Promise<GeneralResponse> {
        return await this.SendMessageByType('PinMatrixAck', { pin: pin });
    }

    /**
     * To response to OnPasspharaseRequest, this function needs to be called
     * @param phassphrase Phassphrase
     */
    public async PassphraseAck(phassphrase: string): Promise<GeneralResponse> {
        return await this.SendMessageByType('PassphraseAck', { passphrase: phassphrase, state: null });
    }

    /**
     * To response to OnWordRequest, this function needs to be called
     * @param word 
     */
    public async WorkAck(word: string) {
        return await this.SendMessageByType('WordAck', { word: word });
    }

    /**
     * Send message to the device
     * @param messageTypeName MessageType
     * @param param Message
     * @param expectedResType Expected response type
     */
    public async SendMessage<T>(messageTypeName: string, param: any, expectedResType: string): Promise<T> {
        return new Promise<T>(async (resolve, reject) => {
            if (this._transport == null)
            {
                reject({ success: false, errorCode: GeneralErrors.NO_TRANSPORT });
                return;
            }

            if (this._transport.IsOpen() == false)
            {
                reject({ success: false, errorCode: GeneralErrors.USER_DID_NOT_SELECT_A_DEVICE });
                return;
            }

            this._sendMessageResolve = resolve;
            this._sendMessageReject = reject;
            this._sendMessageExpectedResponseType = expectedResType;

            await this.SendMessageByType(messageTypeName, param);
        });
    }

    // ***************************************
    // Private Functions
    // ***************************************
    private assertType(res: GeneralResponse, expectedResType: string) {
        if (res.type !== expectedResType) {
            throw new TypeError(`DeviceCommands::assertType->Response of unexpected type: ${res.type}. Should be ${expectedResType}`);
        }
    }

    private async SendMessageByType(typeName: string, message: any): Promise<GeneralResponse> {
        try {
            const type = this.pb.GetMessageByName(typeName);
            const msgId = this.pb.GetMessageTypeIdByName(typeName);
            
            if(msgId == null) {
                throw new Error("Cannot find Message Id by name");
            }

            if(type == null) {
                throw new Error("Cannot find Message type by name");
            }

            const msg = type.create(message);
            if(!msg) {
                throw new Error("Cannot create message");
            }

            const buffer = type.encode(msg).finish();

            return await this._transport.SendProtoMsg(msgId, buffer);

        } catch (e) {
            MyConsole.Exception('DeviceCommands::SendMessageByType->' + e);
            return { 
                success: false, 
                errorCode: GeneralErrors.PROTO_ERR,
                errorMessage: e 
            };
        }
    }

    private OnReceiveDataFromBridge(msgPayload: IMessagePayload): void {
        const res = this.ParsMessage(msgPayload);
        if (res.success == false) {
            return;
        }

        if (res.type === 'Failure') 
        {
            console.log("Failure", res);
            if(this._eventEmitters.emit('OnFailure', res.payload) == false){
                MyConsole.Warning('DeviceCommands::OnReceiveDataFromBridge->OnFailure has no listener');
            }
        } 
        else if (res.type === 'ButtonRequest') 
        {
            if( this._eventEmitters.emit('OnButtonRequest', this.pb.GetEnumNameByValue('ButtonRequestType', res.payload.code)) == false)
            {
                MyConsole.Warning('DeviceCommands::OnReceiveDataFromBridge->OnButtonRequest has no listener');
            }

            // Sending 'ButtonAck' to ProKey to continue its job
            this.SendMessageByType('ButtonAck', {});

        } 
        else if (res.type === 'EntropyRequest') 
        {
            // No need to reply by upper layer
            let rand: Array<number> = Util.generateEntropy(32);
            this.SendMessageByType('EntropyAck', {
                entropy: rand,
            });

        } 
        else if (res.type === 'PinMatrixRequest') 
        { 
            // Next Step: To reply, PinMatrixAck function should be called
            if(this._eventEmitters.emit('OnPinMatrixRequest', this.pb.GetEnumNameByValue('PinMatrixRequestType', res.payload.type)) == false)
            {
                MyConsole.Warning('DeviceCommands::OnReceiveDataFromBridge->OnPinMatrixRequest has no listener');
            }
        } 
        else if (res.type === 'PassphraseRequest') 
        { 
            // Next Step: To reply, PassphraseAck function should be called
            if(this._eventEmitters.emit('OnPasspharaseRequest') == false)
            {
                MyConsole.Warning('DeviceCommands::OnReceiveDataFromBridge->OnPasspharaseRequest has no listener');
            }
        } 
        else if (res.type === 'PassphraseStateRequest') 
        { 
            // No need to reply by upper layer
            const state: string = res.payload.state;
            this._passphraseTemporaryState = state;
            this.SendMessageByType('PassphraseStateAck', {});
        } 
        else if (res.type === 'WordRequest') 
        { 
            // Next Step: To reply, WordAck function should be called
            if(this._eventEmitters.emit('OnWordRequest') == false) 
            {
                MyConsole.Warning('DeviceCommands::OnReceiveDataFromBridge->OnWordRequest has no listener');
            }
        } 
        else 
        {
            try {
                this.assertType(res, this._sendMessageExpectedResponseType);
            } catch(e) {
                if(this._sendMessageReject) {
                    this._sendMessageReject(e);
                }
            }

            if(this._sendMessageResolve) {
                this._sendMessageResolve(res.payload);
            }
        }
    }

    private ParsMessage(msgPayload: IMessagePayload): GeneralResponse {
        try {
            const msg = this.pb.GetMessageById(msgPayload.MsgId);
            if(!msg) {
                throw new Error("Cannot get message by id");
            }

            const type = this.pb.GetMessageTypeById(msgPayload.MsgId);
            if(!type) {
                throw new Error("Cannot get message type by id");
            }

            return {
                success: true,
                type: type,
                payload: msg.decode(msgPayload.ProtoPayload),
            };
        } catch (e) {
            MyConsole.Exception('DeviceCommands::GetMessage->' + e);
            return {
                success: false,
                errorMessage: e,
            };
        }
    }
}
