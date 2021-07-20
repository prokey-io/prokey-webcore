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
import { BitcoinTx } from "../models/BitcoinTx";
import { BitcoinBaseCoinInfoModel, EthereumBaseCoinInfoModel, OmniCoinInfoModel, RippleCoinInfoModel, TronCoinInfoModel } from "../models/CoinInfoModel";
import { EthereumTx } from "../models/EthereumTx";
import { AddressModel, EthereumAddress, LiskAddress, NEMAddress, RippleAddress, CardanoAddress, StellarAddress, PublicKey, EosPublicKey, LiskPublicKey, TezosPublicKey, BinancePublicKey, CardanoPublicKey, SignedTx, EthereumSignedTx, EosSignedTx, LiskSignedTx, TezosSignedTx, BinanceSignTx, CardanoSignedTx, RippleSignedTx, MessageSignature, LiskMessageSignature, Success, TronAddress } from "../models/Prokey";
import { RippleTransaction } from "../models/Responses-V6";
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

    public async GetPublicKey(device: Device, path: string | number[], showOnProkey?: boolean): Promise<PublicKey | EosPublicKey | LiskPublicKey | TezosPublicKey | BinancePublicKey | CardanoPublicKey> {
        return this.GetPublicKeyBase(device, path, showOnProkey);
    }

    public async SignTransaction(device: Device, transaction: BitcoinTx | EthereumTx | RippleTransaction): Promise<SignedTx | EthereumSignedTx | EosSignedTx | LiskSignedTx | TezosSignedTx | BinanceSignTx | CardanoSignedTx | RippleSignedTx> {
        throw new Error("Method not implemented.");
    }

    public async SignMessage(device: Device, path: number[], message: Uint8Array, coinName?: string): Promise<MessageSignature | LiskMessageSignature> {
        return await this.SignMessageBase(device, path, message, coinName || 'TRON');
    }

    public async VerifyMessage(device: Device, address: string, message: Uint8Array, signature: Uint8Array, coinName?: string): Promise<Success> {
        return await this.VerifyMessageBase(device, address, message, signature, coinName || 'TRON');
    }
}
