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

import { MyConsole } from './../utils/console';
import { Root, Type, IParseOptions } from 'protobufjs';


export class Protobuf {
    private static _instance: Protobuf;
    private _pbroot: Root;
    private _isInited = false;

    private constructor() {
        this._pbroot = new Root();
    }

    public static get Instance() {
        if (this._instance === undefined) {
            this._instance = new Protobuf();
        }

        return this._instance;
    }

    Init(callback?: (isSuccess: boolean) => void, protoPath?: string): void {
        let address = '/assets/data/protob/combined.proto.txt';
        if(protoPath != null){
            address = `${protoPath}/combined.proto.txt`;
        }

        const opt: IParseOptions = {
            keepCase: true,
        }

        this._pbroot.load(address, opt).then((root: Root) => {
            this._isInited = true;
            if (callback) {
                callback(true);
            }
        }).catch((reason) => {
            if (callback) {
                callback(false);
            }
        });
    }

    get IsInited() { return this._isInited; }

    GetMessageByName(name: string): Type | null {
        if (this._isInited === false) {
            MyConsole.Error('The protobuf is not inited yet');
            return null;
        }

        const msg = this._pbroot.lookupType(name);
        if (msg === null) {
            MyConsole.Error('Protobuf::GetMessageByName-> Cannot find message name ' + name);
            return null;
        }

        return msg;
    }

    GetMessageTypeById(id: number): string | null {
        try {
            const item = this._pbroot.lookupEnum('MessageType').valuesById[id];
            return item.substring(item.indexOf('_') + 1);
        } catch (e) {
            MyConsole.Exception('Protobuf::GetMessageTypeById->' + e);
            return null;
        }
    }

    GetMessageTypeIdByName(typeName: string): number | null {
        try {
            const item = this._pbroot.lookupEnum('MessageType').values['MessageType_' + typeName];
            return item;
        } catch (e) {
            MyConsole.Exception('Protobuf::GetMessageIdByType->' + e);
            return null;
        }
    }

    GetMessageById(id: number): Type | null {
        try {
            const item = this._pbroot.lookupEnum('MessageType').valuesById[id];
            const msgName = item.substring(item.indexOf('_') + 1);
            const msg = this._pbroot.lookupType(msgName);
            if (msg === null) {
                MyConsole.Error('Protobuf::GetMessageById-> Cannot find message id ' + id);
                return null;
            }

            return msg;

        } catch (e) {
            MyConsole.Exception('Protobuf::GetMessageById->' + e);
            return null;
        }

    }

    GetEnumNameByValue(enumName: string, id: number): string | null {
        try {
            const item = this._pbroot.lookupEnum(enumName);
            if (item) {
                return item.valuesById[id];
            } else {
                MyConsole.Error('Cannot find the enum name ' + enumName );
                return null;
            }
        } catch (e) {
            MyConsole.Exception('Protobuf::GetEnumNameByValue->' + e);
            return null;
        }
    }

    GetEnumValueByName(enumName: string, memberName: string): number | null {
        try {
            const item = this._pbroot.lookupEnum(enumName);
            if (item) {
                return item.values[memberName];
            } else {
                MyConsole.Error('Cannot find the enum name ' + enumName );
                return null;
            }
        } catch (e) {
            MyConsole.Error('Protobuf::GetEnumValueByName->' + e);
            return null;
        }
    }
}
