import Torrent from '../DataStructures/torrent';
import fs from 'fs';

export function read(torrentPath) {
  let fileBuffer = fs.readFileSync(torrentPath);
  let type = fileBuffer[0];
  let index = 0;
  return readType(fileBuffer, 0);
}

function readType(buffer, index) {
  if (isNumber(buffer[index])) {
    return readString(buffer, index);
  }

  let type = byteToChar(buffer[index]);
  if (type === 'd') {
    return readDictionary(buffer, index);
  }
  else if (type == 'i') {
    return readInteger(buffer, index);
  }
  else if (type === 'l') {
    return readList(buffer, index);
  }
  else {
    throw new Error(`Unknown data type: ${type}`);
  }
}

function readDictionary() {
  // returns map
}

export function readInteger(buffer, index) {
  if(byteToChar(buffer[index]) !== 'i')
  {
    throw new Error('Invalid buffer data: missing prefix \'i\'');
  }
  index++;

  let integerAsString = '';

  while (isNumber(buffer[index])) {
    integerAsString += byteToChar(buffer[index]);
    index++;
  }

  if (byteToChar(buffer[index]) !== 'e') {
    throw new Error('Invalid buffer data: missing postfix \'e\'');
  }

  index++;

  return parseInt(integerAsString);
}

export function readKeyValuePair(buffer, index) {
  let key = readType(buffer, index);

  index += key.length + (key.length.toString()).length + 1;
  let value = readType(buffer, index);

  return [key, value];
}

export function readString(buffer, index) {
  let lengthAsString = '';

  while (isNumber(buffer[index])) {
    lengthAsString += byteToChar(buffer[index]);
    index++;
  }

  if (byteToChar(buffer[index]) !== ':') {
    throw new Error('Invalid buffer data: missing semicolon in string');
  }

  index++;

  let length = parseInt(lengthAsString);

  return buffer.slice(index, index + length).toString('ascii');
}

export function readList() {
  // return array
}

function byteToChar(byte) {
  return String.fromCharCode(byte);
}

function isNumber(byte) {
  return byte >= 48 && byte <= 57;
}