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
import AccountDiscoveryResponseWithTwoUTXO from '../testFixtures/blockbook-response/bitcoin/account-discovery/response-with-two-utxos/account.json';
import OneUTXO from '../testFixtures/blockbook-response/bitcoin/account-discovery/response-with-one-utxo/utxos.json';
import TwoUTXOs from '../testFixtures/blockbook-response/bitcoin/account-discovery/response-with-two-utxos/utxos.json';
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

    describe('Test with one UTXO ', () => {
        beforeEach(() => {
            mockApiResponse(accountByXpubUrl(testXpub1), AccountDiscoveryResponseWithOneUTXO);
            mockApiResponse(accountByXpubUrl(testXpub2), AccountDiscoveryResponseWithNoUTXO);
            mockApiResponse(feeEstimationUrl(1), FeeEstimation1);
            mockApiResponse(feeEstimationUrl(3), FeeEstimation3);
            mockApiResponse(feeEstimationUrl(6), FeeEstimation6);
        });

        describe('Send the exact amount', () => {
            it('Should return account with balance', async () => {
                const result = await btcWallet.StartDiscovery();
                expect(result.accounts?.length).to.equal(1);
                if (result.accounts) {
                    expect(result.accounts[0].balance).to.equal(AccountDiscoveryResponseWithOneUTXO.balance);
                } else expect.fail();
            });

            it('Should return `No sufficient balance in your account` because tx amount equals to previous utxo amount and there nothing left for fee', async () => {
                mockApiResponse(accountUtxoUrl, OneUTXO);

                await btcWallet.StartDiscovery();
                await expect(
                    btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: parseInt(OneUTXO[0].value) }])
                ).to.be.rejectedWith('No sufficient balance in your account');
            });

            it('Should generate transaction with one output and one input', async () => {
                mockApiResponse(accountUtxoUrl, OneUTXO);

                await btcWallet.StartDiscovery();
                const fee = await btcWallet.CalculateTransactionFee(
                    [{ Address: testBip49Address2, value: +OneUTXO[0].value }],
                    0
                );
                const rawTx = await btcWallet.GenerateTransaction([
                    { Address: testBip49Address2, value: +OneUTXO[0].value - +fee.normal },
                ]);
                expect(rawTx.outputs.length).equals(1);
                expect(rawTx.inputs.length).equals(1);
            });

            it('Should return error because send amount is more than overall balance', async () => {
                mockApiResponse(accountUtxoUrl, OneUTXO);

                await btcWallet.StartDiscovery();
                await expect(
                    btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: +OneUTXO[0].value + 1000 }])
                ).to.be.rejectedWith('No sufficient balance in your account');
            });

            it('Output amount should be less than the the account balance (fee)', async () => {
                mockApiResponse(accountUtxoUrl, OneUTXO);

                const wallet = await btcWallet.StartDiscovery();
                const fee = await btcWallet.CalculateTransactionFee(
                    [{ Address: testBip49Address2, value: +OneUTXO[0].value }],
                    0
                );
                const rawTx = await btcWallet.GenerateTransaction([
                    { Address: testBip49Address2, value: +OneUTXO[0].value - +fee.normal },
                ]);

                if (wallet.accounts) {
                    expect(parseInt(rawTx.outputs[0].amount)).to.be.lessThan(parseInt(wallet!.accounts[0].balance));
                } else expect.fail();
            });
        });

        describe('Send half the balance', () => {
            it('Should generate transaction with two outputs and one input', async () => {
                mockApiResponse(accountUtxoUrl, OneUTXO);

                await btcWallet.StartDiscovery();
                const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: 100000 }]);
                const fee = await btcWallet.CalculateTransactionFee([{ Address: testBip49Address2, value: 100000 }], 0);
                let outputAmountsSum = 0;
                rawTx.outputs.forEach((item) => {
                    outputAmountsSum += parseInt(item.amount);
                });
                expect(rawTx.outputs.length).equals(2);
                expect(rawTx.inputs.length).equals(1);
                expect(outputAmountsSum + +fee.normal).to.equal(parseInt(AccountDiscoveryResponseWithOneUTXO.balance));
            });

            it('Outputs amount sum should be less than the account balance (fee)', async () => {
                mockApiResponse(accountUtxoUrl, OneUTXO);

                const wallet = await btcWallet.StartDiscovery();
                const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: 10000 }]);
                const fee = await btcWallet.CalculateTransactionFee([{ Address: testBip49Address2, value: 10000 }], 0);
                let outputAmountsSum = 0;
                rawTx.outputs.forEach((item) => {
                    outputAmountsSum += parseInt(item.amount);
                });
                if (wallet.accounts) {
                    expect(outputAmountsSum).to.be.lessThan(parseInt(wallet!.accounts[0].balance));
                } else expect.fail();
                expect(outputAmountsSum + +fee.normal).to.equal(parseInt(AccountDiscoveryResponseWithOneUTXO.balance));
            });
        });
    });

    describe('Test with two UTXOs', () => {
        beforeEach(() => {
            mockApiResponse(accountByXpubUrl(testXpub1), AccountDiscoveryResponseWithTwoUTXO);
            mockApiResponse(accountByXpubUrl(testXpub2), AccountDiscoveryResponseWithNoUTXO);
            mockApiResponse(feeEstimationUrl(1), FeeEstimation1);
            mockApiResponse(feeEstimationUrl(3), FeeEstimation3);
            mockApiResponse(feeEstimationUrl(6), FeeEstimation6);
        });

        it('Should return account with correct balance', async () => {
            const result = await btcWallet.StartDiscovery();
            expect(result.accounts?.length).to.equal(1);
            if (result.accounts) {
                expect(result.accounts[0].balance).to.equal(AccountDiscoveryResponseWithTwoUTXO.balance);
            } else expect.fail();
        });

        describe('send the exact amount', () => {
            it('Should generate transaction with one output and one input', async () => {
                mockApiResponse(accountUtxoUrl, TwoUTXOs);

                await btcWallet.StartDiscovery();
                const fee = await btcWallet.CalculateTransactionFee(
                    [{ Address: testBip49Address2, value: +TwoUTXOs[0].value + +TwoUTXOs[1].value }],
                    0
                );

                const amount = +TwoUTXOs[0].value + +TwoUTXOs[1].value - +fee.normal;
                const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: amount }]);
                expect(rawTx.outputs.length).equals(1);
            });

            it('Output amount should be less than account balance', async () => {
                mockApiResponse(accountUtxoUrl, TwoUTXOs);

                const wallet = await btcWallet.StartDiscovery();
                const fee = await btcWallet.CalculateTransactionFee(
                    [{ Address: testBip49Address2, value: +TwoUTXOs[0].value + +TwoUTXOs[1].value }],
                    0
                );
                const amount = +TwoUTXOs[0].value + +TwoUTXOs[1].value - +fee.normal;
                const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: amount }]);
                if (wallet.accounts) {
                    expect(parseInt(rawTx.outputs[0].amount)).to.be.lessThan(parseInt(wallet.accounts[0].balance));
                } else expect.fail();
            });
        });

        describe('Send less than exact amount', () => {
            it('Should generate transaction with two outputs and two inputs', async () => {
                mockApiResponse(accountUtxoUrl, TwoUTXOs);

                await btcWallet.StartDiscovery();
                const amount = 300_000;
                const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: amount }]);
                const fee = await btcWallet.CalculateTransactionFee([{ Address: testBip49Address2, value: amount }], 0);
                let outputAmountsSum = 0;
                rawTx.outputs.forEach((item) => {
                    outputAmountsSum += parseInt(item.amount);
                });
                expect(rawTx.outputs.length).equals(2);
                expect(rawTx.inputs.length).equals(2);
                expect(outputAmountsSum + +fee.normal).to.equal(parseInt(AccountDiscoveryResponseWithTwoUTXO.balance));
            });

            it('Inputs amount sum should equal account balance', async () => {
                mockApiResponse(accountUtxoUrl, TwoUTXOs);

                const wallet = await btcWallet.StartDiscovery();
                const amount = 300_000;
                const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: amount }]);
                const fee = await btcWallet.CalculateTransactionFee([{ Address: testBip49Address2, value: amount }], 0);
                let outputAmountsSum = 0;
                rawTx.outputs.forEach((item) => {
                    outputAmountsSum += parseInt(item.amount);
                });
                let inputsSum = 0;
                rawTx.inputs.forEach((item) => {
                    inputsSum += parseInt(item!.amount!);
                });
                if (wallet.accounts) {
                    expect(inputsSum).to.equal(parseInt(wallet.accounts[0].balance));
                } else expect.fail();
                expect(outputAmountsSum + +fee.normal).to.equal(parseInt(AccountDiscoveryResponseWithTwoUTXO.balance));
            });

            it('Output amount should be less than account balance', async () => {
                mockApiResponse(accountUtxoUrl, TwoUTXOs);

                const wallet = await btcWallet.StartDiscovery();
                const amount = 300_000;
                const rawTx = await btcWallet.GenerateTransaction([{ Address: testBip49Address2, value: amount }]);
                const fee = await btcWallet.CalculateTransactionFee([{ Address: testBip49Address2, value: amount }], 0);
                let outputAmountsSum = 0;
                rawTx.outputs.forEach((item) => {
                    outputAmountsSum += parseInt(item.amount);
                });
                if (wallet.accounts) {
                    expect(parseInt(rawTx.outputs[0].amount)).to.be.lessThan(
                        parseInt(AccountDiscoveryResponseWithTwoUTXO.balance)
                    );
                } else expect.fail();
                expect(outputAmountsSum + +fee.normal).to.equal(parseInt(AccountDiscoveryResponseWithTwoUTXO.balance));
            });
        });
    });
});
