export default function urlEncodeBuffer(buffer) {
  let encodedURL = '';
  for (let bytePair of buffer.entries())
  {
    let byte = bytePair[1];
    if (isAlphanumeric(byte) || isSpecialCharacter(byte)) {
      encodedURL += String.fromCharCode(byte);
    }
    else {
      encodedURL += '%' + ("00" + byte.toString(16)).substr(-2);
    }
  }
  return encodedURL;

  function isAlphanumeric(byte) {
    return ((byte>=65) && (byte<=90)) || ((byte>=97) && (byte<=122)) || ((byte>=48) && (byte<=57));
  }

  function isSpecialCharacter(byte) {
    const specialChars = [0x21, 0x23, 0x24, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x3A, 0x3B, 0x3D,
      0x3F, 0x40, 0x5B, 0x5D, 0x5F, 0x7E];
    return specialChars.includes(byte);
  }
}