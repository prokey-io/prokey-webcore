import CryptoJS from 'crypto-js';

export class NemHelper {
  private readonly alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  private readonly _hexEncodeArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
  private readonly currentFeeFactor = 0.05;
  /**
   * Convert a public key to a NEM address
   *
   * @param {string} publicKey - A public key
   * @param {number} networkId - A network id
   *
   * @return {string} - The NEM address
   */
  public toAddress(publicKey: string, networkId: number): string {
    let binPubKey = CryptoJS.enc.Hex.parse(publicKey);
    let hash = CryptoJS.SHA3(binPubKey, {
      outputLength: 256
    });
    let hash2 = CryptoJS.RIPEMD160(hash);
    // 98 is for testnet
    let networkPrefix = this.id2Prefix(networkId);
    let versionPrefixedRipemd160Hash = networkPrefix + CryptoJS.enc.Hex.stringify(hash2);
    let tempHash = CryptoJS.SHA3(CryptoJS.enc.Hex.parse(versionPrefixedRipemd160Hash), {
      outputLength: 256
    });
    let stepThreeChecksum = CryptoJS.enc.Hex.stringify(tempHash).substr(0, 8);
    let concatStepThreeAndStepSix = this.hex2a(versionPrefixedRipemd160Hash + stepThreeChecksum);
    let ret = this.b32encode(concatStepThreeAndStepSix);
    return ret;
  }

  public id2Prefix(id) {
    if (id === 104) {
      return "68";
    } else if (id === -104) {
      return "98";
    } else {
      return "60";
    }
  }

  b32encode(s) {
    let parts: Array<string> = [];
    let quanta = Math.floor((s.length / 5));
    let leftover = s.length % 5;

    if (leftover != 0) {
      for (let i = 0; i < (5 - leftover); i++) {
        s += '\x00';
      }
      quanta += 1;
    }

    for (let i = 0; i < quanta; i++) {
      parts.push(this.alphabet.charAt(s.charCodeAt(i * 5) >> 3));
      parts.push(this.alphabet.charAt(((s.charCodeAt(i * 5) & 0x07) << 2) | (s.charCodeAt(i * 5 + 1) >> 6)));
      parts.push(this.alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x3F) >> 1)));
      parts.push(this.alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x01) << 4) | (s.charCodeAt(i * 5 + 2) >> 4)));
      parts.push(this.alphabet.charAt(((s.charCodeAt(i * 5 + 2) & 0x0F) << 1) | (s.charCodeAt(i * 5 + 3) >> 7)));
      parts.push(this.alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x7F) >> 2)));
      parts.push(this.alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x03) << 3) | (s.charCodeAt(i * 5 + 4) >> 5)));
      parts.push(this.alphabet.charAt(((s.charCodeAt(i * 5 + 4) & 0x1F))));
    }

    let replace = 0;
    if (leftover == 1) replace = 6;
    else if (leftover == 2) replace = 4;
    else if (leftover == 3) replace = 3;
    else if (leftover == 4) replace = 1;

    for (let i = 0; i < replace; i++) parts.pop();
    for (let i = 0; i < replace; i++) parts.push("=");

    return parts.join("");
  }

  hex2a(hexx) {
    let hex = hexx.toString();
    let str = '';
    for (let i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
  }

  public calculateMinimum(numNem): number {
    let fee = Math.floor(Math.max(1, numNem / 10000));
    return fee > 25 ? 25 * this.currentFeeFactor : fee * this.currentFeeFactor;
  }

  /**
   * Calculate message fee. 0.05 XEM per commenced 32 bytes
   *
   * If the message is empty, the fee will be 0
   *
   * @param {object} message - An message object
   *
   * @return {number} - The message fee
   */
  calculateMessage(message) {

    if (!message.payload || !message.payload.length)
      return 0.00;

    let length = message.payload.length / 2;

    if (message.type == 2)
      length = 32 + 16 + Math.ceil(length / 16) * 16;

    return this.currentFeeFactor * (Math.floor(length / 32) + 1);
  }
}
