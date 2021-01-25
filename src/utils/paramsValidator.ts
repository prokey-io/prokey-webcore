/* @flow */

var BigNumber = require('big-number');


type Param = {
    name: string,
    type?: 'string' | 'number' | 'array' | 'buffer' | 'boolean' | 'amount' | 'object',
    obligatory?: boolean,
    allowEmpty?: boolean,
}

export const validateParams = (values: Object, fields: Array<Param>): void => {
    fields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(values, field.name)) {
            const value = values[field.name];
            if (field.type) {
                if (field.type === 'array') {
                    if (!Array.isArray(value)) {
                        throw new Error(`Parameter "${field.name}" has invalid type. "${field.type}" expected.`);
                    } else if (!field.allowEmpty && value.length < 1) {
                        throw new Error(`Parameter "${field.name}" is empty.`);
                    }
                } else if (field.type === 'amount') {
                    if (typeof value !== 'string') {
                        throw new Error(`Parameter "${field.name}" has invalid type. "string" expected.`);
                    }
                    try {
                        const bn = new BigNumber(value);
                        if (bn.toFixed(0) !== value) {
                            throw new Error('');
                        }
                    } catch (error) {
                        throw new Error(`Parameter "${field.name}" has invalid value "${value}". Integer representation expected.`);
                    }
                } else if (field.type === 'buffer') {
                    if (typeof value === 'undefined' || (typeof value.constructor.isBuffer === 'function' && value.constructor.isBuffer(value))) {
                        throw new Error(`Parameter "${field.name}" has invalid type. "buffer" expected.`);
                    }
                } else if (typeof value !== field.type) {
                    throw new Error(`Parameter "${field.name}" has invalid type. "${field.type}" expected.`);
                }
            }
        } else if (field.obligatory) {
            throw new Error(`Parameter "${field.name}" is missing.`);
        }
    });
};


export const fixPath = (utxo: any): any => {
    // make sure bip32 indices are unsigned
    if (utxo.address_n && Array.isArray(utxo.address_n)) {
        utxo.address_n = utxo.address_n.map((i:number) => i >>> 0);
    }
    return utxo;
};

