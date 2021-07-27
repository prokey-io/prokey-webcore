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

import { GeneralErrors, GeneralResponse } from "../models/GeneralResponse";
import { IMessagePayload, ITransport } from "./ITransport";
import { IMessageEvent, w3cwebsocket } from "websocket";
import { MyConsole } from "../utils/console";

export class WebSocketTransport implements ITransport {
    onReceiveCallback!: (msgPayload: IMessagePayload) => void;
    onDeviceDisconnect!: () => void;

    _ws: WebSocket;
    _isConnected: boolean = false;
    _msgBuffer: Array<Uint8Array> = new Array<Uint8Array>();
    _msgResolver: any;

    constructor()
    {
        this._ws = new WebSocket("ws://localhost:55500");
    }

    public async Init(isDebug?: boolean, onReceiveCallback?: (msgPayload: IMessagePayload) => void): Promise<GeneralResponse> {
        if (onReceiveCallback) {
            this.onReceiveCallback = onReceiveCallback;
        }
        return { success: true };
    }

    public async Open(path?: string): Promise<GeneralResponse> {
        if (!this._isConnected) {
            this._ws.binaryType = 'arraybuffer';
            this._ws.onmessage = (message: IMessageEvent) => {
                console.debug(message);
                if (message.data instanceof ArrayBuffer)
                    this._msgBuffer.push(new Uint8Array(message.data));
                if (this._msgResolver != null) {
                    this._msgResolver();
                    this._msgResolver = null;
                }
            }
            return new Promise<GeneralResponse>((resolve, reject) => {
                this._ws.onopen = () => {
                    this._isConnected = true;
                    resolve({ success: true });
                };
                this._ws.onclose = (event) => {
                    this._isConnected = false;
                    if (this.onDeviceDisconnect != null)
                        this.onDeviceDisconnect();
                    resolve({ success: false, errorCode: GeneralErrors.NO_DEVICE });
                };
                this._ws.onerror = (err) => {
                    console.error(err);
                    resolve({ success: false, errorCode: GeneralErrors.NO_DEVICE });
                }
            });
        }
        return { success: true };
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
        for (let i = 0; i < data.length; i++) {
            bf[n++] = data[i];
        }

        let res = await this.SendData(bf);
        if (res.success == false)
            return res;

        res = await this.ReceiveData();
        if (res.success) {
            if (this.onReceiveCallback != null) {
                this.onReceiveCallback(res.payload);
            }

            return res;
        }
        else if (res.errorCode == GeneralErrors.NO_DEVICE && this.onDeviceDisconnect != null) {
            this.onDeviceDisconnect();
        }

        return res;
    }

    public async SendData(bMsg: Uint8Array): Promise<GeneralResponse> {
        if (!this._isConnected) {
            return { success: false, errorCode: GeneralErrors.NO_DEVICE };
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

            this._ws.send(bDataToSend.buffer);
        }

        return { success: true };
    }

    private async WaitForData(): Promise<any> {
        if (this._msgBuffer.length == 0) {
            if (!this._isConnected)
                return;
            return new Promise((res, rej) => {
                this._msgResolver = res;
            });
        }
    }

    public async ReceiveData(): Promise<GeneralResponse> {
        let recData: Uint8Array = new Uint8Array();
        var msgLen = 0;
        let firstPacket = true;
        let msgId = 0;
        let n = 0;
        var tmpLen = 0;

        while (true) {
            await this.WaitForData();
            let res: Uint8Array;
            let f = this._msgBuffer.shift();
            if (f != undefined) {
                res = f;
            }
            else {
                return { success: false, errorCode: GeneralErrors.NO_RESPONSE_FROM_DEVICE };
            }

            if (firstPacket) {

                var buf = res;
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
                var buf = res;

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
        return this._isConnected;
    }

    Close(): void {
        this._ws.close();
    }
}