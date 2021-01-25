
/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
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

export function ReverseBuffer(buf: Buffer): Buffer {
    const copy = Buffer.alloc(buf.length);
    buf.copy(copy);
    [].reverse.call(copy);
    return copy;
};

export function ReverseString(buf: string): string {
    return buf.split("").reverse().join("");
};

export function ReverseByteArray(buf: Uint8Array): Uint8Array {
    let copy: Uint8Array = new Uint8Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
        copy[buf.length-i-1] = buf[i];
    }

    return buf;
}

export function HexStringToByteArray(data: string): Uint8Array {
    var b = new Uint8Array(data.length / 2);
    var n = 0;
    while (data.length > 0) {
        b[n] = Number.parseInt(data.substring(0, 2), 16);
        n++;
        data = data.substring(2);
    }

    return b;
}

export function HexStringToByteArrayNumber(data: string): Array<number> {
    if(data.length % 2 == 1) {
        throw new Error("Hex string lenght should be even");
    }

    let n = 0;
    var b: Array<number> = new Array<number>(10);
    while (data.length > 0) {
        b[n++] = Number.parseInt(data.substring(0, 2), 16);
        data = data.substring(2);
    }

    return b;
}

export function ByteArrayToHexString(buf: any): string {
    return Array.from(buf, function (b: number) {
        return ('0' + (b & 0xFF).toString(16)).slice(-2);
    }).join('');
}

export function DecimalStrigArrayToHexString(buf: string, seperator: string): string {
    const da = buf.split(seperator);
    let bArr = new Array();

    da.forEach(element => {
        bArr.push(Number.parseInt(element));
    });

    return ByteArrayToHexString(bArr);
}


export function StringToUint8Array(inp: string): Uint8Array {
    // var string = btoa(unescape(encodeURIComponent(inp))),
    //     charList = string.split(''),
    //     uintArray = [];
    // for (var i = 0; i < charList.length; i++) {
    //     uintArray.push(charList[i].charCodeAt(0));
    // }
    // return new Uint8Array(uintArray);

    const charlist = inp.split('');
    let uintarray = Array<number>();
    for (var i = 0; i < charlist.length; i++) {
        uintarray.push(charlist[i].charCodeAt(0));
    }

    return new Uint8Array(uintarray);
}

export function generateEntropy(len: number): Array<number> {
    if (window.crypto) {
        var array = new Uint8Array(len);
        window.crypto.getRandomValues(array);
        return Array.from(array);
    } else {
        throw new Error('Browser does not support crypto random');
    }
}

function HasHexPrefix(str: string): boolean {
    return str.slice(0, 2).toLowerCase() === '0x';
};

export function StripHexPrefix(str: string): string {
    return HasHexPrefix(str) ? str.slice(2) : str;
};

export function StripLeadingZeroes(str: string) {
    while (/^00/.test(str)) {
        str = str.slice(2);
    }
    return str;
}

export function SplitString(len: number, str?:string): [string, string] {
    if (str == null) {
        return ['', ''];
    }
    const first = str.slice(0, len);
    const second = str.slice(len);
    return [first, second];
};
