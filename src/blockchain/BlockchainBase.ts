/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) 2022 Prokey.io
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

import { RequestAddressInfo } from "../models/GenericWalletModel";
import { BlockchainServerModel } from "./BlockchainProviders";

export abstract class BlockchainBase {
    _servers: BlockchainServerModel[];

    constructor(servers: BlockchainServerModel[]){
        this._servers = servers;
    }

    public abstract GetAddressInfo(reqAdd: RequestAddressInfo);
    public abstract GetAccountInfoByPublicKey(publicKey: string);
    public abstract GetAccountInfoByAddresses(addresses: RequestAddressInfo[]);
    public abstract BroadCastTransaction(transaction: string);
}