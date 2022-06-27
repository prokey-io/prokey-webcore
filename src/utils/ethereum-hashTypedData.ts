import { MessageTypes, TypedMessage, HashTypedDataModel } from "../models/EthereumTypedDataModel";

// eslint-disable-next-line import/no-unresolved
const sigUtil = require('@metamask/eth-sig-util');

/**
 * Calculates the domain_separator_hash and message_hash from an EIP-712 Typed Data object.
 * @param data The EIP-712 Typed Data object
 */
export function HashTypedData(data: TypedMessage<MessageTypes>, isMetamaskV4Compatible: boolean): HashTypedDataModel {
    if(isMetamaskV4Compatible == false) {
        throw new Error("Only version 4 of typed data signing is supported");
    }

    const version = sigUtil.SignTypedDataVersion.V4;
    const { types, primaryType, domain, message } = sigUtil.TypedDataUtils.sanitizeData(data);

    // Compute domain Separator hash
    const domainSeparatorHash = sigUtil.TypedDataUtils.hashStruct(
        'EIP712Domain',
        _sanitizeData(domain),
        types,
        version,
    ).toString('hex');

    let messageHash = null;

    // Compute message hash
    if (primaryType !== 'EIP712Domain') {
        messageHash = sigUtil.TypedDataUtils.hashStruct(
            primaryType,
            _sanitizeData(message),
            types,
            version,
        ).toString('hex');
    }

    return {
        domain_separator_hash: domainSeparatorHash,
        message_hash: messageHash,
    }
}

function _sanitizeData(data) {
    switch (Object.prototype.toString.call(data)) {
        case '[object Object]': {
            const entries = Object.keys(data).map(k => [k, _sanitizeData(data[k])]);
            return Object.fromEntries(entries);
        }

        case '[object Array]':
            return data.map(v => _sanitizeData(v));

        case '[object BigInt]':
            return data.toString();

        default:
            return data;
    }
}

