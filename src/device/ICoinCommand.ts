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

import { Device } from './Device';
import * as ProkeyResponses from '../models/Prokey';
import { BitcoinTx } from '../models/BitcoinTx';
import { EthereumTx } from '../models/EthereumTx';
import { RippleTransaction } from '../models/Responses-V6';
import {StellarSignTransactionRequest} from "../models/Prokey";
import {NEMSignTxMessage} from "../models/Prokey";

export interface ICoinCommands {
    GetAddress(
        device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean,
    ): Promise<ProkeyResponses.AddressModel |
        ProkeyResponses.EthereumAddress |
        ProkeyResponses.LiskAddress |
        ProkeyResponses.NEMAddress |
        ProkeyResponses.RippleAddress |
        ProkeyResponses.CardanoAddress |
        ProkeyResponses.StellarAddress>;

    GetAddresses(
        device: Device,
        path: Array<Array<number> | string>,
    ): Promise<Array< 
        ProkeyResponses.AddressModel |
        ProkeyResponses.EthereumAddress |
        ProkeyResponses.LiskAddress |
        ProkeyResponses.NEMAddress |
        ProkeyResponses.RippleAddress |
        ProkeyResponses.CardanoAddress |
        ProkeyResponses.StellarAddress>>;

    GetPublicKey(
        device: Device,
        path: Array<number> | string,
        showOnProkey?: boolean,
    ): Promise<ProkeyResponses.PublicKey |
        ProkeyResponses.EosPublicKey |
        ProkeyResponses.LiskPublicKey |
        ProkeyResponses.TezosPublicKey |
        ProkeyResponses.BinancePublicKey |
        ProkeyResponses.CardanoPublicKey>;

    SignTransaction(
        device: Device,
        transaction:BitcoinTx | 
                    EthereumTx |
                    RippleTransaction |
                    StellarSignTransactionRequest |
                    NEMSignTxMessage,
    ): Promise<ProkeyResponses.SignedTx |
        ProkeyResponses.EthereumSignedTx |
        ProkeyResponses.EosSignedTx |
        ProkeyResponses.LiskSignedTx |
        ProkeyResponses.TezosSignedTx |
        ProkeyResponses.BinanceSignTx |
        ProkeyResponses.CardanoSignedTx |
        ProkeyResponses.RippleSignedTx |
        ProkeyResponses.NEMSignedTx |
        string>;

    SignMessage(
        device: Device,
        path: Array<number>,
        message: Uint8Array,
        coinName?: string
    ): Promise<ProkeyResponses.MessageSignature |
        ProkeyResponses.LiskMessageSignature>;
    
    VerifyMessage(
        device: Device,
        address: string,
        message: Uint8Array,
        signature: Uint8Array,
        coinName?: string,
    ): Promise<ProkeyResponses.Success>;
}
