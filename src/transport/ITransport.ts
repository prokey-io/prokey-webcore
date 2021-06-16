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

import { GeneralResponse } from '../models/GeneralResponse';

export enum TransportType
{
    WebUsb,
    WebSocket
}

export interface IMessagePayload {
    MsgId: number,
    Lenght: number,
    ProtoPayload: Uint8Array,
}

export type ITransport = {
    onReceiveCallback: (msgPayload: IMessagePayload) => void;
    onDeviceDisconnect: () => void;
    Init(isDebug?: boolean, onReceiveCallback?: (msgPayload: IMessagePayload) => void): Promise<GeneralResponse>;
    Open(path?: string): Promise<GeneralResponse>;
    SendProtoMsg(msgId: number, data: Uint8Array): Promise<GeneralResponse>;
    Close(): void;
    IsOpen(): boolean;
}