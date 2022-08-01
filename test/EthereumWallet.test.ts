import sinon from 'sinon';
import chai from 'chai';
chai.should();
chai.use(require('chai-things'));

const MockXMLHttpRequest = require('mock-xmlhttprequest');
const MockXhr = MockXMLHttpRequest.newMockXhr();

import { Device } from '../src/device/Device';
import { EthereumWallet } from '../src/wallet/EthereumWallet';
import { BaseWallet } from '../src/wallet/BaseWallet';
import * as WalletModel from '../src/models/EthereumWalletModel';
import BigNumber from 'bignumber.js';
import { Features } from '../src/models/Prokey';

const AccountDiscoveryResponseWithNoTokenTransfers: WalletModel.EthereumAccountInfo = require('./testFixtures/account-discovery-3.json');
const AccountDiscoveryResponseWithTokens: WalletModel.EthereumAccountInfo = require('./testFixtures/account-discovery.json');
const DeviceFeaturesSupportingEIP1559: Features = require('./testFixtures/device-features-eip1559.json');
const DeviceFeaturesNotSupportingEIP1559: Features = require('./testFixtures/device-features-no-eip1559.json');

chai.use(require('chai-as-promised'));
const expect = chai.expect;

describe('EthereumWallet test', () => {
    let ethWallet: EthereumWallet;
    let device: Device;
    const defaultPath = "m/44'/60'/0'/0/0";
    const testAddress1 = '0x858abb1F5e2BE982FB755bdcCa5adCB4c08F5954';
    const testAddress2 = '0x6bca60d6ce8d72b087b499abc95b5b1668b33369';
    const usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const testSymbol = 'USDT';
    before(() => {
        MockXhr.onSend = (xhr) => {
            const responseHeaders = { 'Content-Type': 'application/json' };
            const response = JSON.stringify(AccountDiscoveryResponseWithNoTokenTransfers);
            xhr.respond(200, responseHeaders, response);
        };
        global.XMLHttpRequest = MockXhr;
    });

    beforeEach(() => {
        sinon.stub(BaseWallet.prototype, 'GetAddress').callsFake(() => Promise.resolve({ address: testAddress1 }));
        device = new Device();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('StartDiscovery test', () => {
        it('Should return native ETH token transactions', async () => {
            ethWallet = new EthereumWallet(device, 'ETH', false);
            const result = await ethWallet.StartDiscovery();
            result?.accounts?.[0].transactions?.should.all.not.haveOwnProperty('tokenTransfers');
            expect(result.accounts?.length).to.equal(1);
        });

        it('Should return contract token transactions', async () => {
            ethWallet = new EthereumWallet(device, usdtContractAddress, true);
            const result = await ethWallet.StartDiscovery();

            result?.accounts?.[0].transactions?.should.all.haveOwnProperty('tokenTransfers');
        });

        it('All transactions of account should include erc20 token transfer and equal contract symbol', async () => {
            ethWallet = new EthereumWallet(device, usdtContractAddress, true);
            const result = await ethWallet.StartDiscovery();

            const tokenTypes = new Array<string>();
            result?.accounts?.[0].transactions?.forEach((tx) => {
                tx.tokenTransfers.forEach((tt) => {
                    tokenTypes.push(tt.type);
                });
            });

            tokenTypes.should.all.equal('ERC20');

            const tokenSymbols = new Array<string>();
            result?.accounts?.[0].transactions?.forEach((tx) => {
                tx.tokenTransfers.forEach((tt) => {
                    tokenTypes.push(tt.symbol);
                });
            });

            tokenSymbols.should.all.equal(testSymbol);
        });

        it('Should return correct token balance', async () => {
            ethWallet = new EthereumWallet(device, usdtContractAddress, true);
            const result = await ethWallet.StartDiscovery();

            const usdtTokenBalance = AccountDiscoveryResponseWithNoTokenTransfers?.tokens?.find(
                (item) => item.symbol == testSymbol
            )?.balance;

            expect(usdtTokenBalance || '0').to.equal(result.accounts?.[0].balance);
        });
    });

    describe('GetTransactionViewList test', () => {
        it('ETH token transactions count should match fake data', async () => {
            ethWallet = new EthereumWallet(device, 'ETH', false);
            await ethWallet.StartDiscovery();
            const result = await ethWallet.GetTransactionViewList(0, 0, 0);

            const ethTransactions = AccountDiscoveryResponseWithNoTokenTransfers?.transactions?.filter(
                (item) => item.tokenTransfers == undefined
            );

            expect(result.length).to.equal(ethTransactions?.length);
        });

        it('token transactions count should match fake data', async () => {
            ethWallet = new EthereumWallet(device, usdtContractAddress, true);
            await ethWallet.StartDiscovery();
            const result = await ethWallet.GetTransactionViewList(0, 0, 0);

            const tokenTransactions = AccountDiscoveryResponseWithNoTokenTransfers?.transactions?.filter(
                (item) => item.tokenTransfers && item.tokenTransfers[0].token == usdtContractAddress
            );

            expect(result.length).to.equal(tokenTransactions?.length);
        });
    });

    describe('GenerateTransaction test', () => {
        describe('coin type is contract', () => {
            before(() => {
                MockXhr.onSend = (xhr) => {
                    const responseHeaders = { 'Content-Type': 'application/json' };
                    const response = JSON.stringify(AccountDiscoveryResponseWithTokens);
                    xhr.respond(200, responseHeaders, response);
                };
                global.XMLHttpRequest = MockXhr;
            });

            it('Should return a legacy transaction. device not supporting eip1559', async () => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                }));

                ethWallet = new EthereumWallet(device, usdtContractAddress, true);
                await ethWallet.StartDiscovery();
                const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                expect(result).not.to.haveOwnProperty('maxPriorityFeePerGas');
                expect(result).not.to.haveOwnProperty('maxFeePerGas');
                expect(result).to.haveOwnProperty('gasPrice');
            });

            it('Should return a eip1559 transaction. device supports eip1559', async () => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesSupportingEIP1559),
                }));

                ethWallet = new EthereumWallet(device, usdtContractAddress, true);
                await ethWallet.StartDiscovery();
                const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                expect(result).to.haveOwnProperty('maxPriorityFeePerGas');
                expect(result).to.haveOwnProperty('maxFeePerGas');
                expect(result).not.to.haveOwnProperty('gasPrice');
            });
        });

        describe('coin type is ethereum', () => {
            before(() => {
                MockXhr.onSend = (xhr) => {
                    const responseHeaders = { 'Content-Type': 'application/json' };
                    const response = JSON.stringify(AccountDiscoveryResponseWithTokens);
                    xhr.respond(200, responseHeaders, response);
                };
                global.XMLHttpRequest = MockXhr;
            });

            it('Should return a legacy transaction. device not supporting eip1559', async () => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                }));

                ethWallet = new EthereumWallet(device, 'ETH', false);
                await ethWallet.StartDiscovery();
                const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                expect(result).not.to.haveOwnProperty('maxPriorityFeePerGas');
                expect(result).not.to.haveOwnProperty('maxFeePerGas');
                expect(result).to.haveOwnProperty('gasPrice');
            });

            it('Should return a eip1559 transaction. device supports eip1559', async () => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesSupportingEIP1559),
                }));

                ethWallet = new EthereumWallet(device, 'ETH', false);
                await ethWallet.StartDiscovery();
                const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                expect(result).to.haveOwnProperty('maxPriorityFeePerGas');
                expect(result).to.haveOwnProperty('maxFeePerGas');
                expect(result).not.to.haveOwnProperty('gasPrice');
            });
        });

        describe('balance is insufficient', () => {
            before(() => {
                MockXhr.onSend = (xhr) => {
                    const responseHeaders = { 'Content-Type': 'application/json' };
                    const response = JSON.stringify(AccountDiscoveryResponseWithNoTokenTransfers);
                    xhr.respond(200, responseHeaders, response);
                };
                global.XMLHttpRequest = MockXhr;
            });

            beforeEach(() => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                }));
            });

            it('Should get rejected with insufficient balance error', async () => {
                ethWallet = new EthereumWallet(device, usdtContractAddress, true);
                await ethWallet.StartDiscovery();
                await expect(ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000))).to.be.rejectedWith(
                    'Insufficient balance'
                );
            });

            it('Should get rejected with insufficient balance error', async () => {
                ethWallet = new EthereumWallet(device, 'ETH', false);
                await ethWallet.StartDiscovery();
                await expect(
                    ethWallet.GenerateTransaction(testAddress2, new BigNumber('28351323276424620000'))
                ).to.be.rejectedWith('Insufficient balance');
            });
        });
    });
});
