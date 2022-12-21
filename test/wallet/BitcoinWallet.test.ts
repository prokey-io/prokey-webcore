import sinon from 'sinon';
import chai from 'chai';
chai.should();
chai.use(require('chai-things'));

import mock from 'xhr-mock';

import { Device } from '../../src/device/Device';
import { BitcoinWallet } from '../../src/wallet/BitcoinWallet';
import { getHDPath } from '../../src/utils/pathUtils';

import AccountDiscoveryResponseWithNoUTXO from '../testFixtures/blockbook-response/bitcoin/account-discovery-response-without-utxo.json';
import FeeEstimation1 from '../testFixtures/bitcoin/fee-estimation-1.json';
import FeeEstimation3 from '../testFixtures/bitcoin/fee-estimation-3.json';
import FeeEstimation6 from '../testFixtures/bitcoin/fee-estimation-6.json';

chai.use(require('chai-as-promised'));
const expect = chai.expect;

describe('BitcoinWallet test', () => {
    let btcWallet: BitcoinWallet;
    let device: Device;

    const testXpub =
        'ypub6XYtNkkqReigJq4hEdUbqfXzMtVRnzVLkC5vVEBUK1kTkW4mK5GHvkHifNChZuxQ4WUqx2d3qHD35mjgY92372hzqsAQkGE7hcQVxidtJPw';
    const testBip49Address1 = '3QejmTHUioWLhD8z69wVNwWG8uPqnZubft';
    const testBip49Address2 = '3JJmF63ifcamPLiAmLgG96RA599yNtY3EQ';

    const defaultPath = getHDPath("m/49'/0'/0'/0/0");

    const mockApiResponse = (url: string, response: any) => {
        mock.get(url, {
            body: response,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    beforeEach(() => {
        sinon
            .stub(BitcoinWallet.prototype, 'GetAccountPublicKey')
            .callsFake(() => Promise.resolve({ address: testXpub, path: defaultPath }));
        sinon
            .stub(BitcoinWallet.prototype, 'GetAddress')
            .callsFake(() => Promise.resolve({ address: testBip49Address1, path: defaultPath }));
        device = new Device();
        btcWallet = new BitcoinWallet(device, 'BTC');
        mock.setup();
    });

    afterEach(() => {
        sinon.restore();
        mock.teardown();
    });

    describe('Test with no UTXOs', () => {
        const accountByXpubUrl = `https://btc.prokey.app/api/v2/xpub/${testXpub}?page=1&pagesize=1000&details=txs&tokens=used`;
        const accountUtxoUrl = `https://btc.prokey.app/api/v2/utxo/${testXpub}`;

        const feeEstimationUrl = (num: number) => `https://btc.prokey.app/api/v2/estimatefee/${num}`;
        it('Should return one empty btc account', async () => {
            mockApiResponse(accountByXpubUrl, AccountDiscoveryResponseWithNoUTXO);
            const result = await btcWallet.StartDiscovery();
            expect(result.accounts?.length).to.equal(1);
            if (result.accounts) {
                expect(result.accounts[0].balance).to.equal('0');
            } else expect.fail();
        });

        it('Should return one empty btc account', async () => {
            mockApiResponse(accountByXpubUrl, AccountDiscoveryResponseWithNoUTXO);
            mockApiResponse(feeEstimationUrl(1), FeeEstimation1);
            mockApiResponse(feeEstimationUrl(3), FeeEstimation3);
            mockApiResponse(feeEstimationUrl(6), FeeEstimation6);
            mockApiResponse(accountUtxoUrl, []);

            await btcWallet.StartDiscovery();
            await expect(
                btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: 2000 }])
            ).to.be.rejectedWith('No sufficient balance in your account');
        });
    });
});
