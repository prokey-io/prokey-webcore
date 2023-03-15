/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) 2022 Prokey.io
 * 
 * Hadi Robati, hadi@prokey.io
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

/**
 * Base type
 */
export interface MessageTypeProperty {
    name: string;
    type: string;
}

/**
 * Message types
 */
export interface MessageTypes {
    EIP712Domain: MessageTypeProperty[];
    [additionalProperties: string]: MessageTypeProperty[];
}

/**
 * Typed message
 * Now it only extends MessageTypes
 */
export interface TypedMessage<T extends MessageTypes> {
    types: T;
    primaryType: keyof T;
    domain: {
      name?: string;
      version?: string;
      chainId?: number;
      verifyingContract?: string;
      salt?: ArrayBuffer;
    };
    message: Record<string, unknown>;
}

 /**
  * Hash of typed data
  */
export interface HashTypedDataModel {
    domain_separator_hash: string,      // hex string
    message_hash: string | null                // hex string
}