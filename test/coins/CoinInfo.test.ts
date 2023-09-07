import chai from 'chai';
const expect = chai.expect;
chai.use(require('chai-as-promised'));

import { CoinBaseType, CoinInfo } from '../../src/coins/CoinInfo';
import { TronCoinInfoModel } from '../../src/models/CoinInfoModel';

describe('Test CoinInfo for Tron', () => {
    const actualTronModel: TronCoinInfoModel = {
        name: 'Tron',
        shortcut: 'TRX',
        slip44: 195,
        decimals: 6,
        priority: 7,
        on_device: 'Tron',
        test: false,
        support: {
            optimum: '1.11.0',
        },
        tx_url: 'https://tronscan.org/#/transaction/{hash}',
        id: 'tron_TRX',
        coinBaseType: CoinBaseType.Tron,
    };

    it('test if getting the right coinInfo', () => {
        let tron = CoinInfo.Get('tron', CoinBaseType.Tron);
        expect(tron).to.deep.equal(actualTronModel);
    });

    it('test get all coins info by version for tron', () => {
        let coins = CoinInfo.GetAllCoinsInfoByVersion('1.11.0');
        expect(coins).to.be.a('array').to.deep.include(actualTronModel);

        let coinsExceptTron = CoinInfo.GetAllCoinsInfoByVersion('1.10.5');
        expect(coins).to.be.a('array').to.not.deep.include(coinsExceptTron);
    });


});
