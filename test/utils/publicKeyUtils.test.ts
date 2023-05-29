import { validateBitcoinExtendedPublicKey } from '../../src/utils/publicKeyUtils';

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
