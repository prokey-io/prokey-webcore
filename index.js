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

import { Device } from './src/device/Device';
import { BitcoinCommands } from './src/device/BitcoinCommands';
import { EthereumCommands } from './src/device/EthereumCommands';
import { BitcoinWallet } from './src/wallet/BitcoinWallet';
import { EthereumWallet } from './src/wallet/EthereumWallet';
import { OmniWallet } from './src/wallet/OmniWallet';
import { CoinInfo } from './src/coins/CoinInfo';

module.exports = {
    Device,
    BitcoinCommands,
    EthereumCommands,
    BitcoinWallet,
    EthereumWallet,
    OmniWallet,
    CoinInfo,
}

