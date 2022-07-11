import compareVersions from 'compare-versions';
import { Features } from '../models/Prokey';
import { EIP1559_DEVICE_MINIMUM_VERSION_SUPPORT } from './constants';

export const getDeviceVersion = (features: Features) =>
    `${features.major_version}.${features.minor_version}.${features.patch_version}`;

export const supportsEIP1559 = (features: Features) =>
    compareVersions(getDeviceVersion(features), EIP1559_DEVICE_MINIMUM_VERSION_SUPPORT) != -1;
