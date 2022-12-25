import sinon from 'sinon';
import chai from 'chai';
chai.should();
chai.use(require('chai-things'));

import mock from 'xhr-mock';

import { Device } from '../../src/device/Device';
import { BitcoinWallet } from '../../src/wallet/BitcoinWallet';
import { getHDPath } from '../../src/utils/pathUtils';

import AccountDiscoveryResponseWithNoUTXO from '../testFixtures/blockbook-response/bitcoin/account-discovery/response-with-no-utxo/account.json';
import AccountDiscoveryResponseWithOneUTXO from '../testFixtures/blockbook-response/bitcoin/account-discovery/response-with-one-utxo/account.json';
import OneUTXO from '../testFixtures/blockbook-response/bitcoin/account-discovery/response-with-one-utxo/utxos.json';
import FeeEstimation1 from '../testFixtures/bitcoin/fee-estimation-1.json';
import FeeEstimation3 from '../testFixtures/bitcoin/fee-estimation-3.json';
import FeeEstimation6 from '../testFixtures/bitcoin/fee-estimation-6.json';
import FeeList from '../testFixtures/bitcoin/fee-list.json';

chai.use(require('chai-as-promised'));
const expect = chai.expect;

describe('BitcoinWallet test', () => {
    let btcWallet: BitcoinWallet;
    let device: Device;

    const testXpub1 =
        'ypub6XYtNkkqReigJq4hEdUbqfXzMtVRnzVLkC5vVEBUK1kTkW4mK5GHvkHifNChZuxQ4WUqx2d3qHD35mjgY92372hzqsAQkGE7hcQVxidtJPw';

    const testXpub2 =
        'ypub6XYtNkkqReigJq4hEdUbqfXzMtVRnzVLkC5vVEBUK1kTkW4mK5GHvkHifNChZuxQ4WUqx2d3qHD35mjgY92372hzqsAQkGE7hcQVxidtJPm';

    const testBip49Address1 = '3QejmTHUioWLhD8z69wVNwWG8uPqnZubft';
    const testBip49Address2 = '3JJmF63ifcamPLiAmLgG96RA599yNtY3EQ';

    const accountByXpubUrl = (xpub) =>
        `https://btc.prokey.app/api/v2/xpub/${xpub}?page=1&pagesize=1000&details=txs&tokens=used`;
    const accountUtxoUrl = `https://btc.prokey.app/api/v2/utxo/${testXpub1}`;

    const feeEstimationUrl = (num: number) => `https://btc.prokey.app/api/v2/estimatefee/${num}`;

    const bitcoinFeeListUrl = 'https://bitcoinfees.earn.com/api/v1/fees/list';

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
            .onCall(0)
            .returns(Promise.resolve({ address: testXpub1, path: defaultPath }))
            .onCall(1)
            .returns(Promise.resolve({ address: testXpub2, path: defaultPath }));

        sinon
            .stub(BitcoinWallet.prototype, 'GetAddress')
            .callsFake(() => Promise.resolve({ address: testBip49Address1, path: defaultPath }));

        mockApiResponse(bitcoinFeeListUrl, FeeList);
        device = new Device();
        btcWallet = new BitcoinWallet(device, 'BTC');
        mock.setup();
    });

    afterEach(() => {
        sinon.restore();
        mock.teardown();
    });

    describe('Test with no UTXOs', () => {
        it('Should return one empty btc account', async () => {
            mockApiResponse(accountByXpubUrl(testXpub1), AccountDiscoveryResponseWithNoUTXO);
            const result = await btcWallet.StartDiscovery();
            expect(result.accounts?.length).to.equal(1);
            if (result.accounts) {
                expect(result.accounts[0].balance).to.equal('0');
            } else expect.fail();
        });

        it('Should reject with no sufficient balance', async () => {
            mockApiResponse(accountByXpubUrl(testXpub1), AccountDiscoveryResponseWithNoUTXO);
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

    describe('Test with one UTXO with exact amount', () => {
        beforeEach(() => {
            mockApiResponse(accountByXpubUrl(testXpub1), AccountDiscoveryResponseWithOneUTXO);
            mockApiResponse(accountByXpubUrl(testXpub2), AccountDiscoveryResponseWithNoUTXO);
        });

        it('Should return account with balance', async () => {
            const result = await btcWallet.StartDiscovery();
            expect(result.accounts?.length).to.equal(1);
            if (result.accounts) {
                expect(result.accounts[0].balance).to.equal(AccountDiscoveryResponseWithOneUTXO.balance);
            } else expect.fail();
        });

        it('Should return `No sufficient balance in your account` because tx amount equals to previous utxo amount and there nothing left for fee', async () => {
            mockApiResponse(feeEstimationUrl(1), FeeEstimation1);
            mockApiResponse(feeEstimationUrl(3), FeeEstimation3);
            mockApiResponse(feeEstimationUrl(6), FeeEstimation6);
            mockApiResponse(accountUtxoUrl, OneUTXO);

            await btcWallet.StartDiscovery();
            await expect(
                btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: parseInt(OneUTXO[0].value) }])
            ).to.be.rejectedWith('No sufficient balance in your account');
        });

        // it('Should generate transaction with one output', async () => {
        //     mockApiResponse(feeEstimationUrl(1), FeeEstimation1);
        //     mockApiResponse(feeEstimationUrl(3), FeeEstimation3);
        //     mockApiResponse(feeEstimationUrl(6), FeeEstimation6);
        //     mockApiResponse(accountUtxoUrl, OneUTXO);

        //     await btcWallet.StartDiscovery();
        //     const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: OneUTXO[0].value - 3414 }]);
        //     expect(rawTx.outputs.length).equals(1);
        // });

        it('Should return ', async () => {
            mockApiResponse(feeEstimationUrl(1), FeeEstimation1);
            mockApiResponse(feeEstimationUrl(3), FeeEstimation3);
            mockApiResponse(feeEstimationUrl(6), FeeEstimation6);
            mockApiResponse(accountUtxoUrl, OneUTXO);

            await btcWallet.StartDiscovery();
            await expect(
                btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: +OneUTXO[0].value + 1000 }])
            ).to.be.rejectedWith('No sufficient balance in your account');
        });
    });

    describe('Several UTXO + ONE UTXO with exact same amount to send + fee', () => {
        beforeEach(() => {
            mockApiResponse(accountByXpubUrl(testXpub1), AccountDiscoveryResponseWithOneUTXO);
            mockApiResponse(accountByXpubUrl(testXpub2), AccountDiscoveryResponseWithNoUTXO);
        });

        it('Should return account with balance', async () => {
            const result = await btcWallet.StartDiscovery();
            expect(result.accounts?.length).to.equal(1);
            if (result.accounts) {
                expect(result.accounts[0].balance).to.equal(AccountDiscoveryResponseWithOneUTXO.balance);
            } else expect.fail();
        });
    });
});
