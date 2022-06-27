import { formatFixed, BigNumberish, parseFixed, BigNumber } from '@ethersproject/bignumber';

/**
 * Should be hex prefixed for hex value
 */
export const convertToEther = (value: BigNumberish): string => formatFixed(value, 18);

export const convertEtherToWei = (value: string): BigNumber => parseFixed(value, 18);

