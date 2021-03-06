import * as assert from 'assert';
import { Buffer } from 'buffer';

export class RlpEncoding {
  public encode(input: Buffer | string | number | Array<any>) {
    if (input instanceof Array) {
      const output:any[] = []
      for (let i = 0; i < input.length; i++) {
        output.push(this.encode(input[i]))
      }
      const buf = Buffer.concat(output)
      return Buffer.concat([this.encodeLength(buf.length, 192), buf])
    } else {
      input = this.toBuffer(input);
      if (input.length === 1 && input[0] < 128) {
        return input
      } else {
        return Buffer.concat([this.encodeLength(input.length, 128), input])
      }
    }
  }

  private safeParseInt(v, base) {
    if (v.slice(0, 2) === '00') {
      throw (new Error('invalid RLP: extra zeros'))
    }
    return parseInt(v, base)
  }

  private encodeLength(len, offset) {
    if (len < 56) {
      return Buffer.from([len + offset])
    } else {
      const hexLength = this.intToHex(len)
      const lLength = hexLength.length / 2
      const firstByte = this.intToHex(offset + 55 + lLength)
      return Buffer.from(firstByte + hexLength, 'hex')
    }
  }

  /**
   * RLP Decoding based on: {@link https://github.com/ethereum/wiki/wiki/RLP}
   * @param data - will be converted to buffer
   * @returns - returns decode Array of Buffers containg the original message
   **/
  public decode(input: Buffer | string, stream?: boolean): Buffer | Array<any> {
    if (!input || input.length === 0) {
      return Buffer.from([]);
    }

    input = this.toBuffer(input);
    const decoded = this._decode(input);

    if (stream) {
      return decoded as any;
    }

    assert.strictEqual(decoded.remainder.length, 0, 'invalid remainder');
    return decoded.data;
  }

  public getLength(input: string | Buffer): number | Buffer {
    if (!input || input.length === 0) {
      return Buffer.from([])
    }

    input = this.toBuffer(input)
    const firstByte = input[0]
    if (firstByte <= 0x7f) {
      return input.length
    } else if (firstByte <= 0xb7) {
      return firstByte - 0x7f
    } else if (firstByte <= 0xbf) {
      return firstByte - 0xb6
    } else if (firstByte <= 0xf7) {
      // a list between  0-55 bytes long
      return firstByte - 0xbf
    } else {
      // a list  over 55 bytes long
      const llength = firstByte - 0xf6
      const length = this.safeParseInt(input.slice(1, llength).toString('hex'), 16)
      return llength + length
    }
  }

  private _decode(input: Buffer) {
    let length, llength, data, innerRemainder, d;
    const decoded:any[] = []
    const firstByte = input[0]

    if (firstByte <= 0x7f) {
      // a single byte whose value is in the [0x00, 0x7f] range, that byte is its own RLP encoding.
      return {
        data: input.slice(0, 1),
        remainder: input.slice(1)
      }
    } else if (firstByte <= 0xb7) {
      // string is 0-55 bytes long. A single byte with value 0x80 plus the length of the string followed by the string
      // The range of the first byte is [0x80, 0xb7]
      length = firstByte - 0x7f

      // set 0x80 null to 0
      if (firstByte === 0x80) {
        data = Buffer.from([])
      } else {
        data = input.slice(1, length)
      }

      if (length === 2 && data[0] < 0x80) {
        throw new Error('invalid rlp encoding: byte must be less 0x80')
      }

      return {
        data: data,
        remainder: input.slice(length)
      }
    } else if (firstByte <= 0xbf) {
      llength = firstByte - 0xb6
      length = this.safeParseInt(input.slice(1, llength).toString('hex'), 16)
      data = input.slice(llength, length + llength)
      if (data.length < length) {
        throw (new Error('invalid RLP'))
      }

      return {
        data: data,
        remainder: input.slice(length + llength)
      }
    } else if (firstByte <= 0xf7) {
      // a list between  0-55 bytes long
      length = firstByte - 0xbf
      innerRemainder = input.slice(1, length)
      while (innerRemainder.length) {
        d = this._decode(innerRemainder)
        decoded.push(d.data)
        innerRemainder = d.remainder
      }

      return {
        data: decoded,
        remainder: input.slice(length)
      }
    } else {
      // a list  over 55 bytes long
      llength = firstByte - 0xf6
      length = this.safeParseInt(input.slice(1, llength).toString('hex'), 16)
      const totalLength = llength + length
      if (totalLength > input.length) {
        throw new Error('invalid rlp: total length is larger than the data')
      }

      innerRemainder = input.slice(llength, totalLength)
      if (innerRemainder.length === 0) {
        throw new Error('invalid rlp, List has a invalid length')
      }

      while (innerRemainder.length) {
        d = this._decode(innerRemainder)
        decoded.push(d.data)
        innerRemainder = d.remainder
      }
      return {
        data: decoded,
        remainder: input.slice(totalLength)
      }
    }
  }


  /**
   * HELPERS : TO REMOVE
   */

  private isHexPrefixed(str): boolean {
    return str.slice(0, 2) === '0x'
  }

  // Removes 0x from a given String
  private stripHexPrefix(str: string): string {
    if (typeof str !== 'string') {
      return str
    }
    return this.isHexPrefixed(str) ? str.slice(2) : str
  }

  private intToHex(i: number): string {
    let hex = i.toString(16)
    if (hex.length % 2) {
      hex = '0' + hex
    }
    return hex
  }

  private padToEven(a: string): string {
    if (a.length % 2) a = '0' + a
    return a
  }

  private intToBuffer(i: number): Buffer {
    const hex = this.intToHex(i)
    return Buffer.from(hex, 'hex')
  }

  private toBuffer(v: any): Buffer {
    if (!Buffer.isBuffer(v)) {
      if (typeof v === 'string') {
        if (this.isHexPrefixed(v)) {
          v = Buffer.from(this.padToEven(this.stripHexPrefix(v)), 'hex')
        } else {
          v = Buffer.from(v)
        }
      } else if (typeof v === 'number') {
        if (!v) {
          v = Buffer.from([])
        } else {
          v = this.intToBuffer(v)
        }
      } else if (v === null || v === undefined) {
        v = Buffer.from([])
      } else if (v.toArray) {
        // converts a BN to a Buffer
        v = Buffer.from(v.toArray())
      } else {
        throw new Error('invalid type')
      }
    }
    return v
  }
}
