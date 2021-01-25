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

export interface Address {
    address: string;
    path: Array<number>;
    serializedPath: string;
}

export interface CipheredKeyValue {
    value: string;
}

export interface Success {

}

export interface Coininterface {
    coin_name: string;
    coin_shortcut: string;
    address_interface: number;
    maxfee_kb: number;
    address_interface_p2sh: number;
}

export interface Features {
    vendor: string;
    major_version: number;
    minor_version: number;
    patch_version: number;
    bootloader_mode: boolean;
    device_id: string;
    pin_protection: boolean;
    passphrase_protection: boolean;
    language: string;
    label: string;
    coins: Coininterface[];
    initialized: boolean;
    revision: string;
    bootloader_hash: string;
    imported: boolean;
    pin_cached: boolean;
    passphrase_cached: boolean;
    state?: string;
    needs_backup?: boolean;
    firmware_present?: boolean;
}

export interface ResetDeviceSettings {
    display_random?: boolean;
    strength?: number;
    passphrase_protection?: boolean;
    pin_protection?: boolean;
    language?: string;
    label?: string;
    u2f_counter?: number;
    skip_backup?: boolean;
}

export interface HDPrivNode {
    depth: number;
    fingerprint: number;
    child_num: number;
    chain_code: string;
    private_key: string;
}

export interface HDPubNode {
    depth: number;
    fingerprint: number;
    child_num: number;
    chain_code: string;
    public_key: string;
}

export type HDNode = HDPubNode | HDPrivNode;

export interface LoadDeviceSettings {
    pin?: string;
    passphrase_protection?: boolean;
    language?: string;
    label?: string;
    skip_checksum?: boolean;

    mnemonic?: string;
    node?: HDNode;
    payload?: string; // will be converted

    u2f_counter?: number;
}

export interface RecoverDeviceSettings {
    word_count?: number;
    passphrase_protection?: boolean;
    pin_protection?: boolean;
    language?: string;
    label?: string;
    enforce_wordlist?: boolean;
    interface?: number;
    u2f_counter?: number;
}

export interface ApplySettings {
    language?: string;
    label?: string;
    use_passphrase?: boolean;
    homescreen?: string;
}

export interface MessageSignature {
    address: string;
    signature: string;
}

export interface MultisigRedeemScriptinterface {
    pubkeys: Array<{ node: string; address_n: Array<number> }>;
    signatures: Array<string>;
    m?: number;
}

export interface TransactionInput {
    address_n?: Array<number>;
    prev_hash: string;
    prev_index: number;
    script_sig?: string;
    sequence?: number;
    script_interface?: 'SPENDADDRESS' | 'SPENDMULTISIG' | 'EXTERNAL' | 'SPENDWITNESS' | 'SPENDP2SHWITNESS';
    multisig?: MultisigRedeemScriptinterface;
    amount?: number; // only with segwit
    decred_tree?: number;
    decred_script_version?: number;
}

export type TransactionOutput = {
    address: string;
    amount: number; // in satoshis
    script_interface: 'PAYTOADDRESS';
} | {
    address_n: Array<number>;
    amount: number; // in satoshis
    script_interface: 'PAYTOADDRESS' | 'PAYTOP2SHWITNESS';
} | {
    op_return_data: string;
    amount: 0; // fixed
    script_interface: 'PAYTOOPRETURN';
};
// TODO:
// "multisig": MultisigRedeemScriptinterface field; where?
// "decred_script_version": number field; where?

export interface TransactionBinOutput {
    amount: number;
    script_pubkey: string;
}

export interface RefTransaction {
    hash: string;
    version: number;
    inputs: Array<TransactionInput>;
    bin_outputs: Array<TransactionBinOutput>;
    lock_time: number;
    extra_data?: string;
}

export interface TxRequestDetails {
    request_index: number;
    tx_hash?: string;
    extra_data_len?: number;
    extra_data_offset?: number;
}

export interface TxRequestSerialized {
    signature_index?: number;
    signature?: string;
    serialized_tx?: string;
}

export interface TxRequest {
    request_interface: 'TXINPUT' | 'TXOUTPUT' | 'TXMETA' | 'TXFINISHED' | 'TXEXTRADATA';
    details: TxRequestDetails;
    serialized: TxRequestSerialized;
}

export interface SignedTx {
    signatures: Array<string>;
    serializedTx: string;
    txid?: string;
}

export interface EthereumTxRequest {
    data_length?: number;
    signature_v?: number;
    signature_r?: string;
    signature_s?: string;
}

export interface EthereumAddress {
    address: string;
}

export interface EthereumSignedTx {
    // v: number;
    v: string;
    r: string;
    s: string;
}

export interface Identity {
    proto?: string;
    user?: string;
    host?: string;
    port?: string;
    path?: string;
    index?: number;
}

export interface SignedIdentity {
    address: string;
    public_key: string;
    signature: string;
}

export interface PublicKey {
    node: HDPubNode;
    xpub: string;
}

// combined PublicKey and bitcoin.HDNode
export interface HDNodeResponse {
    path: Array<number>;
    serializedPath: string;
    childNum: number;
    xpub: string;
    xpubSegwit?: string;
    chainCode: string;
    publicKey: string;
    fingerprint: number;
    depth: number;
}

// this is what Trezor asks for
export type SignTxInfoToTrezor = {
    inputs: Array<TransactionInput>;
} | {
    bin_outputs: Array<TransactionBinOutput>;
} | {
    outputs: Array<TransactionOutput>;
} | {
    extra_data: string;
} | {
    version: number;
    lock_time: number;
    inputs_cnt: number;
    outputs_cnt: number;
    extra_data_len?: number;
};

// NEM interfaces
export interface NEMAddress {
    address: string;
}

export interface NEMSignedTx {
    data: string;
    signature: string;
}

export interface NEMTransactionCommon {
    address_n?: Array<number>;
    network?: number;
    timestamp?: number;
    fee?: number;
    deadline?: number;
    signer?: string;
}

export interface NEMMosaic {
    namespace?: string;
    mosaic?: string;
    quantity?: number;
}

export interface NEMTransfer {
    mosaics?: Array<NEMMosaic>;
    public_key?: string;
    recipient?: string;
    amount?: number;
    payload?: string;
}

export interface NEMProvisionNamespace {
    namespace?: string;
    sink?: string;
    fee?: number;
    parent?: string;
}

export type NEMMosaicLevyinterface = {
    id: 1;
    name: 'MosaicLevy_Absolute';
} | {
    id: 2;
    name: 'MosaicLevy_Percentile';
};

export type NEMSupplyChangeinterface = {
    id: 1;
    name: 'SupplyChange_Increase';
} | {
    id: 2;
    name: 'SupplyChange_Decrease';
};

export type NEMModificationinterface = {
    id: 1;
    name: 'CosignatoryModification_Add';
} | {
    id: 2;
    name: 'CosignatoryModification_Delete';
};

export type NEMImportanceTransferMode = {
    id: 1;
    name: 'ImportanceTransfer_Activate';
} | {
    id: 2;
    name: 'ImportanceTransfer_Deactivate';
};

export interface NEMMosaicDefinition {
    name?: string;
    ticker?: string;
    namespace?: string;
    mosaic?: string;
    divisibility?: number;
    fee?: number;
    levy?: NEMMosaicLevyinterface;
    levy_address?: string;
    levy_namespace?: string;
    levy_mosaic?: string;
    supply?: number;
    mutable_supply?: boolean;
    transferable?: boolean;
    description?: string;
    networks?: number;
}

export interface NEMMosaicCreation {
    definition?: NEMMosaicDefinition;
    sink?: string;
    fee?: number;
}

export interface NEMMosaicSupplyChange {
    namespace?: string;
    interface?: NEMSupplyChangeinterface;
    mosaic?: string;
    delta?: number;
}

export interface NEMCosignatoryModification {
    interface?: NEMModificationinterface;
    public_key?: string;
}

export interface NEMAggregateModification {
    modifications?: Array<NEMCosignatoryModification>;
    relative_change?: number; // TODO: "sint32"
}

export interface NEMImportanceTransfer {
    mode?: NEMImportanceTransferMode;
    public_key?: string;
}

export interface NEMSignTxMessage {
    transaction?: NEMTransactionCommon;
    cosigning?: boolean;
    multisig?: NEMTransactionCommon;
    transfer?: NEMTransfer;
    provision_namespace?: NEMProvisionNamespace;
    mosaic_creation?: NEMMosaicCreation;
    supply_change?: NEMMosaicSupplyChange;
    aggregate_modification?: NEMAggregateModification;
    importance_transfer?: NEMImportanceTransfer;
}

// Stellar interfaces

export interface StellarAddress {
    address: string;
}

export interface StellarSignedTx {
    public_key: string;
    signature: string;
}

export interface StellarPaymentOp {
    interface: 'StellarTxOpRequest';
    message: {};
}

export interface StellarSignTxMessage {
    address_n: Array<number>;
    source_account: string;
    fee?: number;
    sequence_number?: number;
    network_passphrase: string;
    timebounds_start?: number;
    timebounds_end?: number;
    memo_interface?: number;
    memo_text?:  string;
    memo_id?:  number;
    memo_hash?:  string;
    num_operations: number;
}

interface StellarAsset {
    interface: string;
    code?: string;
    issuer?: string;
}

export type StellarOperationMessage = {
    interface: 'StellarCreateAccountOp';
    new_account?: string;
    source_account: string;
    starting_balance?: number;
} | {
    interface: 'StellarPaymentOp';
    source_account?: string;
    destination_account?: string;
    asset?: StellarAsset;
    amount?: number;
} | {
    interface: 'StellarPathPaymentOp';
    source_account: string;
    send_asset?: StellarAsset;
    send_max?: number;
    destination_account?: string;
    destination_asset?: StellarAsset;
    destination_amount?: number;
    paths?: Array<StellarAsset>;
} | {
    interface: 'StellarManageOfferOp';
    source_account: string;
    offer_id: number;
    amount: number;
    buying_asset: StellarAsset;
    selling_asset: StellarAsset;
    price_n: number;
    price_d: number;
} | {
    interface: 'StellarCreatePassiveOfferOp';
    source_account: string;
    offer_id: number;
    amount: number;
    buying_asset: StellarAsset;
    selling_asset: StellarAsset;
    price_n: number;
    price_d: number;
} | {
    interface: 'StellarSetOptionsOp';
    source_account: string;
    signer_interface?: number;
    signer_key?: string;
    signer_weight?: number;
    clear_flags?: number;
    set_flags?: number;
    master_weight?: number;
    low_threshold?: number;
    medium_threshold?: number;
    high_threshold?: number;
    home_domain?: string;
    inflation_destination_account?: string;
} | {
    interface: 'StellarChangeTrustOp';
    source_account: string;
    asset?: StellarAsset;
    limit?: number;
} | {
    interface: 'StellarAllowTrustOp';
    source_account: string;
    trusted_account: string;
    asset_interface?: number;
    asset_code?: string;
    is_authorized?: number;
} | {
    interface: 'StellarAccountMergeOp';
    source_account: string;
    destination_account: string;
} | {
    interface: 'StellarManageDataOp';
    source_account: string;
    key: string;
    value: string;
} | {
    interface: 'StellarBumpSequenceOp';
    source_account: string;
    bump_to: number;
};

// Cardano interfaces
export interface CardanoAddress {
    address: string;
    address_n?: Array<number>;
}

export interface CardanoPublicKey {
    xpub: string;
    node: HDPubNode;
}

export interface CardanoSignedTx {
    tx_hash: string;
    tx_body: string;
}
export interface CardanoTxInput {
    tx_hash: string;
    address_n: Array<number>;
    output_index: number;
    interface?: number;
}
export interface CardanoTxOutput {
    address?: string;
    address_n?: Array<number>;
    amount: number;
}

export interface CardanoTxRequest {
    tx_index: number;
    tx_hash: string;
    tx_body: string;
}

// Lisk interfaces
export interface LiskAddress {
    address: string;
}

export interface LiskPublicKey {
    public_key: string;
}

export interface LiskMessageSignature {
    public_key: string;
    signature: string;
}

export type LiskAsset = { data: string } |
{ votes: Array<string> } |
{ delegate: { username: string } } |
{ signature: { public_key: string } } |
{
    multisignature: {
        min: number;
        life_time: number;
        keys_group: Array<string>;
    }
};

export interface LiskTransaction {
    interface: number;
    fee: number;
    amount: number;
    timestamp: number;
    recipient_id?: string;
    sender_public_key?: string;
    requester_public_key?: string;
    signature?: string;
    asset?: LiskAsset;
}

export interface LiskSignedTx {
    signature: string;
}

// Ripple interfaces
export interface RippleAddress {
    address: string;
}

export interface RippleTransaction {
    address_n: Array<number>;
    fee?: number;
    flags?: number;
    sequence?: number;
    last_ledger_sequence?: number;
    payment: {
        amount: number;
        destination: string;
    };
}

export interface RippleSignedTx {
    signature: string;
    serialized_tx: string;
}

// GetAccountInfo response
export interface AccountInfo {
    id: number;
    path: Array<number>;
    serializedPath: string;
    xpub: string;
    address: string;
    addressIndex: number;
    addressPath: Array<number>;
    addressSerializedPath: string;
    balance: number;
    confirmed: number;
}

// GetAddress response
export interface Address {
    address: string;
    path: Array<number>;
    serializedPath: string;
}

