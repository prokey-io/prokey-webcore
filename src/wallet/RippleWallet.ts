/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
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

import { CoinBaseType } from "../coins/CoinInfo";
import { Device } from "../device/Device";
import { BaseWallet } from "./BaseWallet";
var WAValidator = require('multicoin-address-validator');

export class RippleWallet extends BaseWallet {

    constructor(device: Device, coinName: string)
    {
        super(device, coinName, CoinBaseType.Ripple);        
    }
    
    public IsAddressValid(address: string): boolean {
        if(WAValidator.validate(address, "xrp")) {
            return true;
        }

        return false;
    }
}
