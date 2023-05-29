import { validateBitcoinExtendedPublicKey, changeVersionBytes } from '../../src/utils/publicKeyUtils';

import chai from 'chai';
const expect = chai.expect;
chai.use(require('chai-as-promised'));

describe('Bitcoin extended public key validator', () => {
    it('test some valid xpub', () => {
        expect(
            validateBitcoinExtendedPublicKey(
                'xpub6CfTMrJMmeZGsAQN5JkUoSKbmovxmV2CwHLDPZhdzXz2VDL8KoRn9E6UiTmC9e3XgmbVP2vzJNT3RD8ji7F2KgMHLEAmNJor1XoC62knXqA'
            )
        ).to.equal(true);

        expect(
            validateBitcoinExtendedPublicKey(
                'ypub6XVifWyGvL6kiTbUufY71XR6wn5Qi71hrPrSAxbXNYMuYK9MaTbLmHkcjfin9YhT6QiJ8WXYm2obJVkJRof37v2tCZsBxDdLHFrqUaMn36P'
            )
        ).to.equal(true);

        expect(
            validateBitcoinExtendedPublicKey(
                'zpub6rKyyBeC51eEZknbk2KjDcWc7kDrej1CmWNexMVQkYjnbQxaq7kuPMQkksgN9TMNW3q6sz87DhA9BnMs9W53v9iV4uZcY8SpYyvUsBsDBVK'
            )
        ).to.equal(true);
    });

    it('test some invalid xpub', () => {
        expect(
            validateBitcoinExtendedPublicKey('xpub6CfTMrJMmeZGsAQN5JkUoSKbmovxmV2CwHLDPZhdzXz2VDL8KoRn9E6UiTmC9e3X') //! Invalid length
        ).to.equal(false);

        expect(
            validateBitcoinExtendedPublicKey(
                'xpub6CfTMrJMmeZGsAQN5JkUoSKbmovxmV2CwHLDPZhdzXz2VDL8KoRn9E6UiTmC9e3XgmbVP2vzJNT3RD8ji7F2KgMHLEAmNJor1XoC62knXqB' // Invalid checksum
            )
        ).to.equal(false);

        expect(
            validateBitcoinExtendedPublicKey(
                'ypub6CfTMrJMmeZGsAQN5JkUoSKbmovxmV2CwHLDPZhdzXz2VDL8KoRn9E6UiTmC9e3XgmbVP2vzJNT3RD8ji7F2KgMHLEAmNJor1XoC62knXqA' // Invalid prefix
            )
        ).to.equal(false);
    });
});

describe('Change bitcoin public key version', () => {
    it('xpub to ypub', () => {
        expect(
            changeVersionBytes(
                'xpub6CfTMrJMmeZGsAQN5JkUoSKbmovxmV2CwHLDPZhdzXz2VDL8KoRn9E6UiTmC9e3XgmbVP2vzJNT3RD8ji7F2KgMHLEAmNJor1XoC62knXqA',
                'ypub'
            )
        ).to.equal(
            'ypub6XVifWyGvL6kiTbUufY71XR6wn5Qi71hrPrSAxbXNYMuYK9MaTbLmHkcjfin9YhT6QiJ8WXYm2obJVkJRof37v2tCZsBxDdLHFrqUaMn36P'
        );
    });

    it('ypub to xpub', () => {
        expect(
            changeVersionBytes(
                'ypub6XVifWyGvL6kiTbUufY71XR6wn5Qi71hrPrSAxbXNYMuYK9MaTbLmHkcjfin9YhT6QiJ8WXYm2obJVkJRof37v2tCZsBxDdLHFrqUaMn36P',
                'xpub'
            )
        ).to.equal(
            'xpub6CfTMrJMmeZGsAQN5JkUoSKbmovxmV2CwHLDPZhdzXz2VDL8KoRn9E6UiTmC9e3XgmbVP2vzJNT3RD8ji7F2KgMHLEAmNJor1XoC62knXqA'
        );
    });

    it('xpub to zpub', () => {
        expect(
            changeVersionBytes(
                'xpub6CHJwwB3nukoT7eMsJfcM8RTKUzPfH5LpFcSRbFGqRXHtUkAmPsz67Mo4mVe2vmPanBEaWyakwJ7arDE83L2U16BELTVJ1w5J8KVfyMqtzE',
                'zpub'
            )
        ).to.equal(
            'zpub6qwqZGWt6Gqm9i2bY2ErmJcTfRHHYX4LeUeszP33bSH3zgNdGiD7LEg57BQp2k5EQ4Qr5UAhgG1DMRSMZSA44UTNy1rLTqa3qaSnT9GmdsF'
        );
    });

    it('zpub to xpub', () => {
        expect(
            changeVersionBytes(
                'zpub6qwqZGWt6Gqm9i2bY2ErmJcTfRHHYX4LeUeszP33bSH3zgNdGiD7LEg57BQp2k5EQ4Qr5UAhgG1DMRSMZSA44UTNy1rLTqa3qaSnT9GmdsF',
                'xpub'
            )
        ).to.equal(
            'xpub6CHJwwB3nukoT7eMsJfcM8RTKUzPfH5LpFcSRbFGqRXHtUkAmPsz67Mo4mVe2vmPanBEaWyakwJ7arDE83L2U16BELTVJ1w5J8KVfyMqtzE'
        );
    });

    it('ypub to zpub', () => {
        expect(
            changeVersionBytes(
                'ypub6X7aFbqxwbJHJQqUhfTEZDWxVT8qbu4qjN8fCz9ADRuAwaZQ243YiB1w5yTE2qRJzRJ3Kza9DbefU8pnqjk3GEmn6g9usvkZZrP94VcBVdz',
                'zpub'
            )
        ).to.equal(
            'zpub6qwqZGWt6Gqm9i2bY2ErmJcTfRHHYX4LeUeszP33bSH3zgNdGiD7LEg57BQp2k5EQ4Qr5UAhgG1DMRSMZSA44UTNy1rLTqa3qaSnT9GmdsF'
        );
    });

    it('zpub to ypub', () => {
        expect(
            changeVersionBytes(
                'zpub6qwqZGWt6Gqm9i2bY2ErmJcTfRHHYX4LeUeszP33bSH3zgNdGiD7LEg57BQp2k5EQ4Qr5UAhgG1DMRSMZSA44UTNy1rLTqa3qaSnT9GmdsF',
                'ypub'
            )
        ).to.equal(
            'ypub6X7aFbqxwbJHJQqUhfTEZDWxVT8qbu4qjN8fCz9ADRuAwaZQ243YiB1w5yTE2qRJzRJ3Kza9DbefU8pnqjk3GEmn6g9usvkZZrP94VcBVdz'
        );
    });
});
