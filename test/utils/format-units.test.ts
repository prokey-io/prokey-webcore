import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { convertToEther, convertEtherToWei } from '../../src/utils/format-units';

describe('format-units test', () => {
    describe('convertToEther test', () => {
        it('should convert to ether correctly', () => {
            expect(convertToEther('1000000000000000000')).to.equal('1.0');
            expect(convertToEther('1100000000000000000')).to.equal('1.1');
            expect(convertToEther('0')).to.equal('0.0');
            expect(convertToEther(1000000000000000)).to.equal('0.001');
            expect(convertToEther('0x56BC75E2D63100000')).to.equal('100.0');
            expect(convertToEther('0x152D02C7E14AF6800000')).to.equal('100000.0');

            expect(convertToEther(BigNumber.from('0x64'))).to.equal('0.0000000000000001');
            expect(convertToEther(BigNumber.from(100000000))).to.equal('0.0000000001');
            expect(convertToEther(BigNumber.from('10000000000000000000'))).to.equal('10.0');
        });
    });

    describe('convertEtherToWei test', () => {
        it('should convert ether to wei correctly', () => {
            expect(convertEtherToWei('1.1').toString()).to.equal('1100000000000000000');
            expect(convertEtherToWei('0.0001').toNumber()).to.equal(100000000000000);
        });
    });
});
