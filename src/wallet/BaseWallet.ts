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

import { Device } from "../device/Device";
import {
    BitcoinBaseCoinInfoModel,
    EthereumBaseCoinInfoModel,
    Erc20BaseCoinInfoModel,
    OmniCoinInfoModel
} from '../models/CoinInfoModel'
import { CoinBaseType, CoinInfo } from '../coins/CoinInfo'
import { ICoinCommands } from '../device/ICoinCommand'
import { BitcoinCommands } from '../device/BitcoinCommands';
import { EthereumCommands } from '../device/EthereumCommands';
import {
    AddressModel,
    EthereumAddress,
    LiskAddress,
    NEMAddress,
    RippleAddress,
    CardanoAddress,
    StellarAddress,
    PublicKey,
    CardanoPublicKey,
    BinancePublicKey,
    EosPublicKey,
    LiskPublicKey,
    TezosPublicKey,
    SignedTx,
    EthereumSignedTx,
    EosSignedTx,
    LiskSignedTx,
    TezosSignedTx,
    BinanceSignTx,
    CardanoSignedTx,
    Success,
    TronTransaction,
    TronSignedTx
} from "../models/Prokey";

import {
    MessageSignature,
    LiskMessageSignature
} from '../models/Prokey';

import * as Util from '../utils/utils';

import { BitcoinTx } from '../models/BitcoinTx';
import { EthereumTx } from '../models/EthereumTx';
import { RippleCommands } from "../device/RippleCommands";
import { RippleSignedTx, RippleTransaction } from "../models/Prokey";
import { TronCommands } from "../device/TronCommands";

/**
 * This is the base class for all implemented wallets
 */
export abstract class BaseWallet {
    private _coinInfo: BitcoinBaseCoinInfoModel | EthereumBaseCoinInfoModel | Erc20BaseCoinInfoModel | OmniCoinInfoModel;
    private _commands!: ICoinCommands;

    /**
     * base class constructor
     * @param _device The prokey device
     * @param _coinName Coin name, Check /data/ProkeyCoinsInfo.json
     * @param _coinType Coin type BitcoinBase | EthereumBase | ERC20 | NEM | OMNI | OTHERS
     */
    constructor(private _device: Device, coinName: string, coinType: CoinBaseType, chainOrPropertyNumber?: number ) {
        if (_device == null)
            throw new Error('Device can not be null');

        // will threw an exception if coin can not be found
        this._coinInfo = CoinInfo.Get(coinName, coinType, chainOrPropertyNumber);

        // create the device commands
        switch (coinType) {
            case CoinBaseType.BitcoinBase:
            case CoinBaseType.OMNI:
                this._commands = new BitcoinCommands(coinName, coinType == CoinBaseType.OMNI);
                break;

            case CoinBaseType.EthereumBase:
            case CoinBaseType.ERC20:
                this._commands = new EthereumCommands(coinName, coinType == CoinBaseType.ERC20);
                break;

            case CoinBaseType.Ripple:
                this._commands = new RippleCommands(coinName);
                break;

            case CoinBaseType.Tron:
                this._commands = new TronCommands(_coinName);
                break;

            default:
                throw new Error("Unknown coin type");
                break;
        }
    }

    /**
     * Get CoinInfo
     */
    public GetCoinInfo(): BitcoinBaseCoinInfoModel | EthereumBaseCoinInfoModel | Erc20BaseCoinInfoModel | OmniCoinInfoModel {
        return this._coinInfo;
    }

    /**
     * Get Prokey device
     */
    public GetDevice(): Device {
        return this._device;
    }

    /**
     * Get device commands
     */
    public GetCommands(): ICoinCommands {
        return this._commands;
    }

    /**
     * Get Address
     * @param path Path to address
     * @param showOnProkey boolean, true means show address on prokey device
     */
    public async GetAddress<T extends AddressModel | EthereumAddress | LiskAddress | NEMAddress | RippleAddress | CardanoAddress | StellarAddress>(path: Array<number> | string, showOnProkey?: boolean) {
        return await this._commands.GetAddress(this._device, path, showOnProkey) as T;
    }

    /**
     * Get list of addresses, usually used for account discovert
     * @param paths list of paths to get list of addresses
     */
    public async GetAddresses<T extends AddressModel | EthereumAddress | LiskAddress | NEMAddress | RippleAddress | CardanoAddress | StellarAddress>(paths: Array<Array<number> | string>) {
        return await this._commands.GetAddresses(this._device, paths) as Array<T>
    }

    /**
     * Get Public key
     * @param path BIP32 path
     * @param showOnProkey boolean, true means show public on prokey device
     */
    public async GetPublicKey<T extends PublicKey | CardanoPublicKey | BinancePublicKey | EosPublicKey | LiskPublicKey | TezosPublicKey>(path: string | Array<number>, showOnProkey?: boolean) {
        return await this._commands.GetPublicKey(this._device, path, showOnProkey) as T;
    }

    /**
     * Sign Transaction
     * @param tx transaction to be signed by device
     */
    public async SignTransaction<T extends SignedTx | EthereumSignedTx | EosSignedTx | 
        LiskSignedTx | TezosSignedTx | BinanceSignTx | CardanoSignedTx | RippleSignedTx | 
        TronSignedTx>
        (tx: BitcoinTx | EthereumTx | RippleTransaction | TronTransaction): Promise<T> 
    {
        return await this._commands.SignTransaction(this._device, tx) as T;
    }

    /**
     * Sign Message 
     * @param path BIP32 Path to sign the message
     * @param message Message to be signed
     * @param coinName Optional, Only for Bitcoin based coins
     */
    public async SignMessage<T extends MessageSignature | LiskMessageSignature>(path: Array<number>, message: string, coinName?: string): Promise<T> {
        const messageBytes = Util.StringToUint8Array(message)
        return await this._commands.SignMessage(this._device, path, messageBytes, coinName) as T;
    }

    /**
     * Verify message
     * @param address Address
     * @param message Signed message
     * @param signature Signature
     * @param coinName Optional, Only for Bitcoin based coins
     * @returns 
     */
    public async VerifyMessage(address: string, message: string, signature: string, coinName?: string): Promise<Success> {
        const messageBytes = Util.StringToUint8Array(message);
        const signBytes = Util.HexStringToByteArray(signature);
        return await this._commands.VerifyMessage(this._device, address, messageBytes, signBytes, coinName);
    }

    /**
     * Address validator
     * @param address address to be checked
     */
    public abstract IsAddressValid(address: string): boolean;
}
