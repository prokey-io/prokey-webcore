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
import { Erc20BaseCoinInfoModel } from './../src/models/CoinInfoModel';
import { CoinBaseType } from '../src/coins/CoinInfo';
import { JsonRpcProvider, TransactionResponse } from '@ethersproject/providers';
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber';

const AccountDiscoveryResponseWithNoTokenTransfers: WalletModel.EthereumAccountInfo = require('./testFixtures/account-discovery-3.json');
const AccountDiscoveryResponseWithTokens: WalletModel.EthereumAccountInfo = require('./testFixtures/account-discovery.json');
const DeviceFeaturesSupportingEIP1559: Features = require('./testFixtures/device-features-eip1559.json');
const DeviceFeaturesNotSupportingEIP1559: Features = require('./testFixtures/device-features-no-eip1559.json');
const OnchainTxData: TransactionResponse = require('./testFixtures/ethers-tx-result.json');
const PublicProviders = require('../data/NetworkProviders.json');

chai.use(require('chai-as-promised'));
const expect = chai.expect;

const setAccountDiscoveryServerResponse = (res: any) => {
    MockXhr.onSend = (xhr) => {
        const responseHeaders = { 'Content-Type': 'application/json' };
        const response = JSON.stringify(res);
        xhr.respond(200, responseHeaders, response);
    };
    global.XMLHttpRequest = MockXhr;
};

describe('EthereumWallet test', () => {
    let ethWallet: EthereumWallet;
    let device: Device;
    const defaultPath = "m/44'/60'/0'/0/0";
    const testAddress1 = '0x9F8cCdaFCc39F3c7D6EBf637c9151673CBc36b88';
    const testAddress2 = '0x6bca60d6ce8d72b087b499abc95b5b1668b33369';
    const USDTContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const WETHContractAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    const usdtCoinInfo: Erc20BaseCoinInfoModel = {
        chain_id: 56,
        address: '0x55d398326f99059fF775485246999027B3197955',
        shortcut: 'USDT',
        decimals: 18,
        name: 'Tether USD (bep20)',
        coinBaseType: CoinBaseType.ERC20,
        id: 'erc20_bsc_usdt',
        priority: 4,
        slip44: 60,
        support: {
            optimum: '1.10.2',
        },
        tx_url: 'https://bscscan.com/tx/{hash}',
        type: '2',
    };

    const testSymbol = 'USDT';
    before(() => {
        setAccountDiscoveryServerResponse(AccountDiscoveryResponseWithNoTokenTransfers);
    });

    beforeEach(() => {
        sinon.stub(BaseWallet.prototype, 'GetAddress').callsFake(() => Promise.resolve({ address: testAddress1 }));
        device = new Device();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('test Ethereum Wallet with public provider', () => {
        before(() => {
            sinon.stub(JsonRpcProvider.prototype, 'sendTransaction').callsFake(() => Promise.resolve(OnchainTxData));
            //@ts-ignore
            sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
            }));
        });

        describe('coin type is BNB', () => {
            const balanceHex = '0x9269476624fdee';
            const balanceNumber = '41211101977050606';
            before(() => {
                sinon
                    .stub(JsonRpcProvider.prototype, 'getBalance')
                    .callsFake(() => Promise.resolve(EthersBigNumber.from(balanceHex)));
            });

            it('ethereum wallet should contain public provider servers', () => {
                ethWallet = new EthereumWallet(device, 'BNB', false);
                const provider = PublicProviders.find((item) => item.chainId == 56);
                expect(ethWallet._ethBlockchain._servers.length).equal(provider.url.length);
            });

            it('BNB account balance should equal to the mock balance', async () => {
                ethWallet = new EthereumWallet(device, 'BNB', false);
                const result = await ethWallet.StartDiscovery();
                expect(result?.accounts?.[0].balance).equal(balanceNumber);
            });
        });

        describe('coin type is a USDT token', () => {
            it('ethereum wallet should contain public provider servers', () => {
                ethWallet = new EthereumWallet(device, '', true, usdtCoinInfo);
                const provider = PublicProviders.find((item) => item.chainId == 56);
                expect(ethWallet._ethBlockchain._servers.length).equal(provider.url.length);
            });

            // it('USDT account balance should equal to the mock balance', async () => {
            //     ethWallet = new EthereumWallet(device, 'BNB', false);
            //     const result = await ethWallet.StartDiscovery();
            //     expect(result?.accounts?.[0].balance).equal(balanceNumber);
            // });
        });
    });

    // it('pass this', async () => {
    //     const rawtx = await ethWallet.GenerateTransaction('0x', new BigNumber(630));
    //     const tx = await ethWallet.SendTransaction('dfgdfg');
    //     expect(tx.txid).equal(OnchainTxData.hash);
    // });

    describe('StartDiscovery test', () => {
        it('Should return native ETH token transactions', async () => {
            ethWallet = new EthereumWallet(device, 'BNB', false);
            const result = await ethWallet.StartDiscovery();
            result?.accounts?.[0].transactions?.should.all.not.haveOwnProperty('tokenTransfers');
            expect(result.accounts?.length).to.equal(1);
        });

        it('Should return contract token transactions', async () => {
            ethWallet = new EthereumWallet(device, USDTContractAddress, true);
            const result = await ethWallet.StartDiscovery();

            result?.accounts?.[0].transactions?.should.all.haveOwnProperty('tokenTransfers');
        });

        it('All transactions of account should include erc20 token transfer and equal contract symbol', async () => {
            ethWallet = new EthereumWallet(device, USDTContractAddress, true);
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

        it('When coin type is contract ethBalance property should also have value on account model', async () => {
            ethWallet = new EthereumWallet(device, USDTContractAddress, true);
            const result = await ethWallet.StartDiscovery();

            expect(parseInt(result?.accounts?.[0].ethBalance!)).to.greaterThanOrEqual(0);
        });

        it('When coin type is ETH, ethBalance property should not exist on account model', async () => {
            ethWallet = new EthereumWallet(device, 'ETH', false);
            const result = await ethWallet.StartDiscovery();

            expect(result?.accounts?.[0].ethBalance).to.not.exist;
        });

        describe('txs should equal to transactions count', () => {
            it('coin type is ETH', async () => {
                ethWallet = new EthereumWallet(device, 'ETH', false);
                const result = await ethWallet.StartDiscovery();

                const ethTransactions = AccountDiscoveryResponseWithNoTokenTransfers.transactions?.filter(
                    (item) => !item.tokenTransfers
                );

                expect(result?.accounts?.[0].txs).to.equal(ethTransactions?.length);
            });
        });

        describe('Balance test', () => {
            it('token Balance should be zero when there is no token transfers', async () => {
                setAccountDiscoveryServerResponse(AccountDiscoveryResponseWithNoTokenTransfers);

                ethWallet = new EthereumWallet(device, USDTContractAddress, true);
                const result = await ethWallet.StartDiscovery();

                expect(result.accounts?.[0].balance).to.equal('0');
            });

            it('token Balance should be zero when there is no transaction for it', async () => {
                setAccountDiscoveryServerResponse(AccountDiscoveryResponseWithTokens);

                ethWallet = new EthereumWallet(device, WETHContractAddress, true);
                const result = await ethWallet.StartDiscovery();

                expect(result.accounts?.[0].balance).to.equal('0');
            });
        });
    });

    describe('GetTransactionViewList test', () => {
        before(() => {
            setAccountDiscoveryServerResponse(AccountDiscoveryResponseWithNoTokenTransfers);
        });

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
            ethWallet = new EthereumWallet(device, USDTContractAddress, true);
            await ethWallet.StartDiscovery();
            const result = await ethWallet.GetTransactionViewList(0, 0, 0);

            const tokenTransactions = AccountDiscoveryResponseWithNoTokenTransfers?.transactions?.filter(
                (item) => item.tokenTransfers && item.tokenTransfers[0].token == USDTContractAddress
            );

            expect(result.length).to.equal(tokenTransactions?.length);
        });
    });

    describe('GenerateTransaction test', () => {
        describe('coin type is contract', () => {
            before(() => {
                setAccountDiscoveryServerResponse(AccountDiscoveryResponseWithTokens);
            });

            it('Should return a legacy transaction. device not supporting eip1559', async () => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                }));

                ethWallet = new EthereumWallet(device, USDTContractAddress, true);
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

                ethWallet = new EthereumWallet(device, USDTContractAddress, true);
                await ethWallet.StartDiscovery();
                const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                expect(result).to.haveOwnProperty('maxPriorityFeePerGas');
                expect(result).to.haveOwnProperty('maxFeePerGas');
                expect(result).not.to.haveOwnProperty('gasPrice');
            });

            describe('device supporting eip1559 is not important', () => {
                before(() => {
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                    }));
                });

                it('Gas limit should be more than 21000 because coin type is contract', async () => {
                    ethWallet = new EthereumWallet(device, USDTContractAddress, true);
                    await ethWallet.StartDiscovery();
                    const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                    const gaslimit = Number('0x' + result.gasLimit).toFixed();
                    expect(parseInt(gaslimit)).to.greaterThan(21000);
                });
            });
        });

        describe('coin type is ethereum', () => {
            before(() => {
                setAccountDiscoveryServerResponse(AccountDiscoveryResponseWithTokens);
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

            it('Gas limit should equal to 21000 because coin type is ethereum', async () => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesSupportingEIP1559),
                }));

                ethWallet = new EthereumWallet(device, 'ETH', false);
                await ethWallet.StartDiscovery();
                const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                const gaslimit = Number('0x' + result.gasLimit).toFixed();
                expect(parseInt(gaslimit)).to.equal(21000);
            });
        });

        describe('balance is insufficient', () => {
            before(() => {
                setAccountDiscoveryServerResponse(AccountDiscoveryResponseWithNoTokenTransfers);
            });

            beforeEach(() => {
                // @ts-ignore
                sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                    GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                }));
            });

            it('Should get rejected with insufficient balance error', async () => {
                ethWallet = new EthereumWallet(device, USDTContractAddress, true);
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
