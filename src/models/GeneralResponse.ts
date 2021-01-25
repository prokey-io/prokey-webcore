/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

export enum GeneralErrors {
    NO_ERR = 0,

    //! Client Side Errors
    NO_RESPONSE_FROM_BRIDGE,
    NO_DEVICE,
    CAN_NOT_ACQUIRE_DEVICE,
    NO_RESPONSE_FROM_DEVICE,
    NOT_IN_BOOTLOADER,
    PROTO_ERR,
    ERR_CHG1,
    ERR_CHG2,
    ERR_CHG3,
    ERR_CHG4,
    DEVICE_RETURN_FIRMWARE_ERROR,
    NO_WEB_USB,
    NO_TRANSPORT,
    USER_DID_NOT_SELECT_A_DEVICE,
    CAN_NOT_OPEN_USB,

    INVALID_PARAM = 0x80,
    MISSING_PARAM,
    PATH_NOT_VALID,
    BUSY,
    SIGNING_FAILED,
    UNKNOWN,
}

export interface GeneralResponse {
    success: boolean;
    errorCode?: GeneralErrors;
    errorMessage?: string;
    payload?: any;
    type?: string;
}