import sinon from 'sinon';
import chai from 'chai';
chai.should();
chai.use(require('chai-things'));

const MockXMLHttpRequest = require('mock-xmlhttprequest');
const MockXhr = MockXMLHttpRequest.newMockXhr();

import { Device } from '../src/device/Device';
import { EthereumWallet } from '../src/wallet/EthereumWallet';
import { BaseWallet } from '../src/wallet/BaseWallet';

const AccountDiscoveryResponse = require('./fakeData/account-discovery.json');

const expect = chai.expect;

describe('EthereumWallet test', () => {
    let ethWallet: EthereumWallet;
    let device: Device;
    const defaultPath = "m/44'/60'/0'/0/0";
    const testAddress1 = '0x858abb1F5e2BE982FB755bdcCa5adCB4c08F5954';
    const testAddress2 = '0x6bca60d6ce8d72b087b499abc95b5b1668b33369';
    const usdtContractAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    before(() => {
        MockXhr.onSend = (xhr) => {
            const responseHeaders = { 'Content-Type': 'application/json' };
            const response = JSON.stringify(AccountDiscoveryResponse);
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

            tokenSymbols.should.all.equal('USDT');
        });
    });

    describe('GetTransactionViewList test', () => {
        it('ETH token transactions count should match fake data', async () => {
            ethWallet = new EthereumWallet(device, 'ETH', false);
            await ethWallet.StartDiscovery();
            const result = await ethWallet.GetTransactionViewList();

            const ethTransactions = AccountDiscoveryResponse.transactions.filter(
                (item) => item.tokenTransfers == undefined
            );

            expect(result.length).to.equal(ethTransactions.length);
        });

        it('token transactions count should match fake data', async () => {
            ethWallet = new EthereumWallet(device, usdtContractAddress, true);
            await ethWallet.StartDiscovery();
            const result = await ethWallet.GetTransactionViewList();

            const tokenTransactions = AccountDiscoveryResponse.transactions.filter(
                (item) => item.tokenTransfers && item.tokenTransfers[0].token == usdtContractAddress
            );

            expect(result.length).to.equal(tokenTransactions.length);
        });
    });
});
