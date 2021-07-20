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

import { CoinBaseType, CoinInfo } from "../coins/CoinInfo";
import { TronCoinInfoModel } from "../models/CoinInfoModel";
import { TronTransaction, PublicKey, RippleSignedTx, MessageSignature, Success, TronAddress } from "../models/Prokey";
import { BaseCommands } from "./BaseCommands";
import { Device } from "./Device";
import { ICoinCommands } from "./ICoinCommand";

export class TronCommands extends BaseCommands implements ICoinCommands {
    
    private _coinInfo: TronCoinInfoModel;

    public constructor(coinName: string)
    {
        super();
        this._coinInfo = CoinInfo.Get<TronCoinInfoModel>(coinName, CoinBaseType.Tron);
        if (this._coinInfo == null) {
            throw new Error(`Cannot load CoinInfo for ${coinName}`);
        }
    }

    GetCoinInfo(): TronCoinInfoModel {
        return this._coinInfo;
    }

    public async GetAddress(device: Device, path: Array<number>, showOnProkey?: boolean): Promise<TronAddress> {
        return await this.GetAddressBase('TronGetAddress', 'TronAddress', device, path, showOnProkey);
    }

    public async GetAddresses(device: Device, paths: Array<Array<number>>): Promise<TronAddress[]> {
        return await this.GetAddressesBase('TronGetAddress', 'TronAddress', device, paths);
    }

    public async GetPublicKey(device: Device, path: string | number[], showOnProkey?: boolean): Promise<PublicKey> {
        return this.GetPublicKeyBase(device, path, showOnProkey);
    }

    public async SignTransaction(device: Device, transaction: TronTransaction): Promise<RippleSignedTx> {
        throw new Error("Method not implemented.");
    }

    public async SignMessage(device: Device, path: number[], message: Uint8Array, coinName?: string): Promise<MessageSignature> {
        return await this.SignMessageBase(device, path, message, coinName || 'TRON');
    }

    public async VerifyMessage(device: Device, address: string, message: Uint8Array, signature: Uint8Array, coinName?: string): Promise<Success> {
        return await this.VerifyMessageBase(device, address, message, signature, coinName || 'TRON');
    }
}
