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
import * as Utils from '../utils/utils';
import { IMessagePayload, ITransport } from './ITransport'
import { GeneralResponse, GeneralErrors } from '../models/GeneralResponse';

declare global {
    interface Navigator {
        // @ts-ignore
        usb: {
            getDevices(): any[];
        }
    }
}

export class WebUsb implements ITransport {
    onReceiveCallback!: (msgPayload: IMessagePayload) => void;
    onDeviceDisconnect!: () => void;

    _usb: any;
    _port: any;
    _intervalId: any = null;

    prokeyFilters = [
        { vendorId: 0x1209, productId: 0xAAAA },
        { vendorId: 0x1364, productId: 0x0001 }
    ];

    constructor() {
        this._usb = navigator.usb;
    }

    public async Init(isDebug?: boolean, onReceiveCallback?: (msgPayload: IMessagePayload) => void): Promise<GeneralResponse> {
        if(onReceiveCallback) {
            this.onReceiveCallback = onReceiveCallback;
        }
        //! Get USB device instance
        return await this._enumerate();
    }

    public async Open(path?: string): Promise<GeneralResponse> {

        //! Open USB device
        let res = await this._acquire();
        if(res.success == false){
            return res;
        }

        this._usb.addEventListener('disconnect', () => {
            if (this.onDeviceDisconnect != null) {
                this.onDeviceDisconnect();
            }
        })

        return res;
    }

    public async SendProtoMsg(msgId: number, data: Uint8Array): Promise<GeneralResponse> {
        const bf = new Uint8Array(data.length + 6);
        let n = 0;

        // MsgType
        bf[n++] = msgId >> 8;
        bf[n++] = msgId & 0xFF;

        // Lenght of data
        bf[n++] = data.length >> 24;
        bf[n++] = data.length >> 16;
        bf[n++] = data.length >> 8;
        bf[n++] = data.length;

        // Data
        for(let i=0; i<data.length; i++){
            bf[n++] = data[i];
        }

        let res = await this.SendData(bf);
        if (res.success == false)
            return res;

        res = await this.ReceiveData();
        if (res.success) {
            if(this.onReceiveCallback != null) {
                this.onReceiveCallback(res.payload);
            }

            return res;
        }
        else if (res.errorCode == GeneralErrors.NO_DEVICE && this.onDeviceDisconnect != null) {
            this.onDeviceDisconnect();
        }

        return res;
    }

    public async SendStrig(data: string): Promise<GeneralResponse> {
        if (this._port === undefined || this._port == null) {
            return { success: false, errorCode: GeneralErrors.USER_DID_NOT_SELECT_A_DEVICE };
        }

        var bMsg = Utils.HexStringToByteArray(data);
        this.SendData(bMsg);

        let recStr: string = "";
        var len = 0;
        let firstPacket = true;
        var isValid = true;

        while (true) {
            const res = await this._port.transferIn(1, 64);

            if (res.status == "stall") {
                this._port.clearHalt("in", 1);
                continue;
            }

            // TODO: Handle babble status
            //if (res.status == "babble") //! still have more data
            //continue;

            if (firstPacket) {
                firstPacket = false;

                var uint8View = new Uint8Array(res.data.buffer);
                len = uint8View[5] << 24;
                len |= uint8View[6] << 16;
                len |= uint8View[7] << 8;
                len |= uint8View[8];

                var rawStr: string = Buffer.from(res.data.buffer).toString('hex');

                // validate start bytes
                if (rawStr.substring(0, 6).toLowerCase() != '3f2323')
                    isValid = false; //! Can not return err right now because maybe there are some IN data in the USB buffer

                //! Remove '?##" characters from data
                recStr = rawStr.substring(6);
            }
            else {
                var rawStr: string = Buffer.from(res.data.buffer).toString('hex');

                // validate start byte
                if (rawStr.substring(0, 2).toLowerCase() != '3f')
                    isValid = false;

                //! Remove '?' characted from data
                recStr += rawStr.substring(2);
            }

            len -= 64;
            if (len > 0) //! still have more data
                continue;

            if (isValid)
                return { success: true, payload: recStr };
            else
                return { success: false, errorCode: GeneralErrors.PROTO_ERR };
        }
    }

    public async SendData(bMsg: Uint8Array): Promise<GeneralResponse> {
        if (this._port === undefined || this._port == null) {
            return { success: false, errorCode: GeneralErrors.USER_DID_NOT_SELECT_A_DEVICE };
        }

        let l = bMsg.length;
        let bDataToSend = new Uint8Array(64);
        var firstPacket = true;
        var n = 0;
        var msgOutIndex = 0;

        while (l > 0) {
            n = 0;
            if (firstPacket) {
                firstPacket = false;
                bDataToSend[n++] = 0x3F;
                bDataToSend[n++] = 0x23;
                bDataToSend[n++] = 0x23;
            }
            else {
                bDataToSend[n++] = 0x3F;
            }

            while (n < 64) {
                if (l > 0) {
                    l--;
                    bDataToSend[n++] = bMsg[msgOutIndex++];
                }
                else
                    bDataToSend[n++] = 0x00; // Padding
            }
            
            await this._port.transferOut(1, bDataToSend);
        }

        return { success: true };
    }

    public async ReceiveData(): Promise<GeneralResponse> {
        let recData: Uint8Array = new Uint8Array();
        var msgLen = 0;
        let firstPacket = true;
        let msgId = 0;
        let n = 0;
        var tmpLen = 0;


        while (true) {
            let res;
            try {
                res = await this._port.transferIn(1, 64);
            }
            catch (e) {
                MyConsole.Exception("WebUsb::ReceiveData", e);
                if (e.name == "NotFoundError") {
                    return {
                        success: false,
                        errorMessage: "The device was disconnected",
                        errorCode: GeneralErrors.NO_DEVICE,
                    };
                }

                return {
                    success: false,
                    errorCode: GeneralErrors.UNKNOWN,
                };
            }

            if (res.status == "stall") {
                this._port.clearHalt("in", 1);
                continue;
            }

            if (firstPacket) {
                
                var buf = new Uint8Array(res.data.buffer);
                // Check start bytes
                if (buf[0] != 0x3F || buf[1] != 0x23 || buf[2] != 0x23) {
                    return { 
                        success: false, 
                        errorCode: GeneralErrors.PROTO_ERR 
                    };
                }

                firstPacket = false;

                // message ID
                msgId = buf[3] << 8;
                msgId |= buf[4];

                // message data length
                msgLen = buf[5] << 24;
                msgLen |= buf[6] << 16;
                msgLen |= buf[7] << 8;
                msgLen |= buf[8];

                recData = new Uint8Array(msgLen);

                // Max data len here can be 55 bytes
                let l = (msgLen > 55) ? 55 : msgLen;
                tmpLen = msgLen - l;

                for (let i = 0; i < l; i++)
                    recData[n++] = buf[i + 9];
            }
            else {
                var buf = new Uint8Array(res.data.buffer);

                // validate start byte
                if (buf[0] != 0x3F) {
                    return { 
                        success: false, 
                        errorCode: GeneralErrors.PROTO_ERR 
                    };
                }

                // Max data len here can be 63 bytes
                let l = (tmpLen > 63) ? 63 : tmpLen;
                tmpLen -= l;

                for (let i = 0; i < l; i++)
                    recData[n++] = buf[i + 1];
            }

            if (tmpLen > 0) //! still have more data
                continue;

            return {
                success: true, 
                payload: {
                    MsgId: msgId,
                    Lenght: msgLen,
                    ProtoPayload: recData,
                }
            };
        }
    }

    public IsOpen(): boolean {
        if(this._port == null || this.Open == null)
            return false;

        return this._port.opened;
    }

    async delay(ms: number): Promise<void> {
        await new Promise<void>(resolve => setTimeout(() => resolve(), ms)).then(() => console.log("fired"));
    }

    Close(): void {

    }

    private async _enumerate(): Promise<GeneralResponse> {
        if (this._usb === undefined || this._usb == null) {
            return { success: false, errorCode: GeneralErrors.NO_WEB_USB };
        }

        let devices = await this._usb.getDevices();

        if (devices == null) {
            return { success: false, errorCode: GeneralErrors.NO_DEVICE };
        }

        // TODO: Handle more than one device 
        // Check the devices which has been selected before
        for (let i = 0; i < devices.length; i++) {
            var existDevice = devices[i];

            for(let j=0; j< this.prokeyFilters.length; j++){
                // TODO: Check other Vendor & Product IDs
                if (existDevice.vendorId == this.prokeyFilters[j].vendorId && existDevice.productId == this.prokeyFilters[j].productId) {
                    this._port = existDevice;

                    return { success: true, payload: existDevice };
                }
            }
        }


        // Now a popup will be shown by the browser to let the user to select a Device
        // We'll get an exception if the user cancel this popup though
        try {
            let device = await this._usb.requestDevice({ filters: this.prokeyFilters });
            if (device == null) {
                return { success: false, errorCode: GeneralErrors.USER_DID_NOT_SELECT_A_DEVICE };
            }

            this._port = device;

            return { success: true, payload: device };
        }
        catch (ex) {
            return { success: false, errorCode: GeneralErrors.USER_DID_NOT_SELECT_A_DEVICE };
        }
    }

    private async _acquire(): Promise<GeneralResponse> {
        if (this._port === undefined || this._port == null) {
            return { success: false, errorCode: GeneralErrors.USER_DID_NOT_SELECT_A_DEVICE };
        }

        try {
            await this._port.open();

            // Select device configuration 1 -> Prokey Optimum
            if (this._port.configuration === null) {
                await this._port.selectConfiguration(1);
            }

            // Select first interface. (The second one is for 2FA)
            await this._port.claimInterface(0);

            return { success: true, payload: this._port };
        }
        catch (_) {
            return { success: false, errorCode: GeneralErrors.CAN_NOT_OPEN_USB };
        }
    }
}