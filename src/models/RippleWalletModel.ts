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

import { AddressModel } from "./Prokey";

export interface RippleAccountInfo {
    account: string,
    balance: number,
    domain?: string,
    emailHash?: string,
    messageKey?: string,
    accountTxnID?: number,
    regularKey?: number,    
	ownerCount?: number,    
	previousTxnID?: string,
	previousTxnLgrSeq?: number,    
	sequence?: number,    
	tickSize?: number,
	transferRate?: number,  
	ledgerEntryType?: number,
	accountRoot?: any,
	flags?: number,
	index?: string
    addressModel?: AddressModel,
}