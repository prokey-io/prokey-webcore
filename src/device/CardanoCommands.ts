import { BitcoinTx } from "../models/BitcoinTx";
import { EthereumTx } from "../models/EthereumTx";
import {
  AddressModel,
  EthereumAddress,
  LiskAddress,
  NEMAddress,
  RippleAddress,
  CardanoAddress,
  StellarAddress,
  PublicKey,
  EosPublicKey,
  LiskPublicKey,
  TezosPublicKey,
  BinancePublicKey,
  CardanoPublicKey,
  NEMSignTxMessage,
  SignedTx,
  EthereumSignedTx,
  EosSignedTx,
  LiskSignedTx,
  TezosSignedTx,
  BinanceSignTx,
  CardanoSignedTx,
  RippleSignedTx,
  NEMSignedTx,
  MessageSignature,
  LiskMessageSignature,
  Success,
} from "../models/Prokey";
import { RippleTransaction } from "../models/Responses-V6";
import { Device } from "./Device";
import { ICoinCommands } from "./ICoinCommand";

export class CardanoCommands implements ICoinCommands {
  /**
   *
   */
  constructor() {}
  GetAddress(
    device: Device,
    path: string | number[],
    showOnProkey?: boolean
  ): Promise<
    | AddressModel
    | EthereumAddress
    | LiskAddress
    | NEMAddress
    | RippleAddress
    | CardanoAddress
    | StellarAddress
  > {
    throw new Error("Method not implemented.");
  }
  GetAddresses(
    device: Device,
    path: (string | number[])[]
  ): Promise<
    (
      | AddressModel
      | EthereumAddress
      | LiskAddress
      | NEMAddress
      | RippleAddress
      | CardanoAddress
      | StellarAddress
    )[]
  > {
    throw new Error("Method not implemented.");
  }
  GetPublicKey(
    device: Device,
    path: string | number[],
    showOnProkey?: boolean
  ): Promise<
    | PublicKey
    | EosPublicKey
    | LiskPublicKey
    | TezosPublicKey
    | BinancePublicKey
    | CardanoPublicKey
  > {
    throw new Error("Method not implemented.");
  }
  SignTransaction(
    device: Device,
    transaction: BitcoinTx | EthereumTx | RippleTransaction | NEMSignTxMessage
  ): Promise<
    | SignedTx
    | EthereumSignedTx
    | EosSignedTx
    | LiskSignedTx
    | TezosSignedTx
    | BinanceSignTx
    | CardanoSignedTx
    | RippleSignedTx
    | NEMSignedTx
  > {
    throw new Error("Method not implemented.");
  }
  SignMessage(
    device: Device,
    path: number[],
    message: Uint8Array,
    coinName?: string
  ): Promise<MessageSignature | LiskMessageSignature> {
    throw new Error("Method not implemented.");
  }
  VerifyMessage(
    device: Device,
    address: string,
    message: Uint8Array,
    signature: Uint8Array,
    coinName?: string
  ): Promise<Success> {
    throw new Error("Method not implemented.");
  }
}
