import { Device } from './Device';
import * as ProkeyResponses from '../models/Prokey';
import { BitcoinTx } from '../models/BitcoinTx';
import { EthereumTx } from '../models/EthereumTx';
import { BitcoinBaseCoinInfoModel, EthereumBaseCoinInfoModel, OmniCoinInfoModel } from '../models/CoinInfoModel';

export interface ICoinCommands {
    GetCoinInfo() : BitcoinBaseCoinInfoModel | EthereumBaseCoinInfoModel | OmniCoinInfoModel | null;

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
                    EthereumTx,

    ): Promise<ProkeyResponses.SignedTx |
        ProkeyResponses.EthereumSignedTx |
        ProkeyResponses.EosSignedTx |
        ProkeyResponses.LiskSignedTx |
        ProkeyResponses.TezosSignedTx |
        ProkeyResponses.BinanceSignTx |
        ProkeyResponses.CardanoSignedTx>;
}