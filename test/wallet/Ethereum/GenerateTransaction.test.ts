import sinon from 'sinon';
import chai from 'chai';
chai.should();
chai.use(require('chai-things'));

import mock from 'xhr-mock';

import { Device } from '../../../src/device/Device';
import { EthereumWallet } from '../../../src/wallet/EthereumWallet';
import { BaseWallet } from '../../../src/wallet/BaseWallet';
import BigNumber from 'bignumber.js';
import { Erc20BaseCoinInfoModel } from '../../../src/models/CoinInfoModel';
import { CoinBaseType } from '../../../src/coins/CoinInfo';

import AccountDiscoveryResponseWithNoTokenTransfers from '../../testFixtures/blockbook-response/ethereum/account-discovery-response-with-no-token-transfers.json';
import EmptyAccount from '../../testFixtures/blockbook-response/ethereum/empty-account.json';
const AccountDiscoveryResponseWithTokens = require('../../testFixtures/blockbook-response/ethereum/account-discovery-response-with-tokens.json');
const DeviceFeaturesSupportingEIP1559 = require('../../testFixtures/device-features/device-features-eip1559.json');
const DeviceFeaturesNotSupportingEIP1559 = require('../../testFixtures/device-features/device-features-no-eip1559.json');

chai.use(require('chai-as-promised'));
const expect = chai.expect;

describe('EthereumWallet test', () => {
    const defaultPath = "m/44'/60'/0'/0/0";
    const testAddress1 = '0x9F8cCdaFCc39F3c7D6EBf637c9151673CBc36b88';
    const testAddress2 = '0x6bca60d6ce8d72b087b499abc95b5b1668b33369';
    const USDTContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const WETHContractAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    const mockApiResponse = (url: string, response: any) => {
        mock.get(url, {
            body: response,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    const getUrl = (network = 'eth', address = testAddress1) =>
        `https://${network}.prokey.app/blockbook/${network}/api/v2/address/${address}?page=1&pagesize=1000&details=txs&tokens=nonzero`;

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

    describe('coin type is contract', () => {
        beforeEach(() => {
            sinon
                .stub(BaseWallet.prototype, 'GetAddress')
                .onCall(0)
                .returns(Promise.resolve({ address: testAddress1 }))
                .onCall(1)
                .returns(Promise.resolve({ address: testAddress2 }));
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('GenerateTransaction test', () => {
            beforeEach(() => mock.setup());

            afterEach(() => {
                mock.reset();
                mock.teardown();
            });
            describe('coin type is contract', () => {
                it('Should return a legacy transaction. device not supporting eip1559', async () => {
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                    }));
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithTokens });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);
                    const ethWallet = new EthereumWallet(new Device(), USDTContractAddress, true);
                    await ethWallet.StartDiscovery();
                    const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                    expect(result).not.to.haveOwnProperty('maxPriorityFeePerGas');
                    expect(result).not.to.haveOwnProperty('maxFeePerGas');
                    expect(result).to.haveOwnProperty('gasPrice');
                });

                it('Should return a eip1559 transaction. device supports eip1559', async () => {
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithTokens });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesSupportingEIP1559),
                    }));

                    const ethWallet = new EthereumWallet(new Device(), USDTContractAddress, true);
                    await ethWallet.StartDiscovery();
                    const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(1));
                    expect(result).to.haveOwnProperty('maxPriorityFeePerGas');
                    expect(result).to.haveOwnProperty('maxFeePerGas');
                    expect(result).not.to.haveOwnProperty('gasPrice');
                });

                it('Gas limit should be more than 21000 because coin type is contract', async () => {
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithTokens });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                    }));

                    const ethWallet = new EthereumWallet(new Device(), USDTContractAddress, true);
                    await ethWallet.StartDiscovery();
                    const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                    const gaslimit = Number('0x' + result.gasLimit).toFixed();
                    expect(parseInt(gaslimit)).to.greaterThan(21000);
                });
            });

            describe('coin type is ethereum', () => {
                it('Should return a legacy transaction. device not supporting eip1559', async () => {
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithTokens });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                    }));

                    const ethWallet = new EthereumWallet(new Device(), 'ETH', false);
                    await ethWallet.StartDiscovery();
                    const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                    expect(result).not.to.haveOwnProperty('maxPriorityFeePerGas');
                    expect(result).not.to.haveOwnProperty('maxFeePerGas');
                    expect(result).to.haveOwnProperty('gasPrice');
                });

                it('Should return a eip1559 transaction. device supports eip1559', async () => {
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithTokens });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesSupportingEIP1559),
                    }));

                    const ethWallet = new EthereumWallet(new Device(), 'ETH', false);
                    await ethWallet.StartDiscovery();
                    const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                    expect(result).to.haveOwnProperty('maxPriorityFeePerGas');
                    expect(result).to.haveOwnProperty('maxFeePerGas');
                    expect(result).not.to.haveOwnProperty('gasPrice');
                });

                it('Gas limit should equal to 21000 because coin type is ethereum', async () => {
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithTokens });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesSupportingEIP1559),
                    }));

                    const ethWallet = new EthereumWallet(new Device(), 'ETH', false);
                    await ethWallet.StartDiscovery();
                    const result = await ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000));
                    const gaslimit = Number('0x' + result.gasLimit).toFixed();
                    expect(parseInt(gaslimit)).to.equal(21000);
                });
            });

            describe('balance is insufficient', () => {
                it('Should get rejected with insufficient balance error', async () => {
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                    }));
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithNoTokenTransfers });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);

                    const ethWallet = new EthereumWallet(new Device(), USDTContractAddress, true);
                    await ethWallet.StartDiscovery();
                    await expect(ethWallet.GenerateTransaction(testAddress2, new BigNumber(100000))).to.be.rejectedWith(
                        'Insufficient balance'
                    );
                });

                it('Should get rejected with insufficient balance error', async () => {
                    // @ts-ignore
                    sinon.stub(BaseWallet.prototype, 'GetDevice').callsFake(() => ({
                        GetFeatures: () => Promise.resolve(DeviceFeaturesNotSupportingEIP1559),
                    }));
                    mockApiResponse(getUrl('eth', testAddress1), { ...AccountDiscoveryResponseWithNoTokenTransfers });
                    mockApiResponse(getUrl('eth', testAddress2), EmptyAccount);

                    const ethWallet = new EthereumWallet(new Device(), 'ETH', false);
                    await ethWallet.StartDiscovery();
                    await expect(
                        ethWallet.GenerateTransaction(testAddress2, new BigNumber('28351323276424620000'))
                    ).to.be.rejectedWith('Insufficient balance');
                });
            });
        });
    });
});
