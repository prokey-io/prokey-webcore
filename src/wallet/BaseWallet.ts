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
import { BitcoinBaseCoinInfoModel, 
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
    CardanoSignedTx
 } from "../models/Prokey";

import { BitcoinTx } from '../models/BitcoinTx';
import { EthereumTx } from '../models/EthereumTx';

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
    constructor(private _device: Device, private _coinName: string, private _coinType: CoinBaseType) {
        if(_device == null)
            throw new Error('Device can not be null');
        
        // will threw an exception if coin can not be found
        this._coinInfo = CoinInfo.Get(_coinName, _coinType);

        // create the device commands
        if(_coinType == CoinBaseType.BitcoinBase) {
            this._commands = new BitcoinCommands(_coinName);
        } 
        else if(_coinType == CoinBaseType.EthereumBase || _coinType == CoinBaseType.ERC20) {
            this._commands = new EthereumCommands(_coinName, _coinType == CoinBaseType.ERC20);
        }
        else if(_coinType == CoinBaseType.OMNI){
            this._commands = new BitcoinCommands(_coinName, true);
        }
    }

    /**
     * Get CoinInfo
     */
    public GetCoinInfo(): any {
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
    public async SignTransaction<T extends SignedTx | EthereumSignedTx | EosSignedTx | LiskSignedTx | TezosSignedTx | BinanceSignTx | CardanoSignedTx>(tx: BitcoinTx | EthereumTx): Promise<T> {
        return await this._commands.SignTransaction(this._device, tx) as T;
    }

    /**
     * Address validator
     * @param address address to be checked
     */
    public abstract IsAddressValid(address: string): boolean;
}
