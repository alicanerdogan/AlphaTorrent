import Torrent from '../DataStructures/torrent';
import fs from 'fs';

export function read(torrentPath) {
  let fileBuffer = fs.readFileSync(torrentPath);
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

function readKeyValuePair() {
  // return array
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

function readList() {
  // return array
}

function byteToChar(byte) {
  return String.fromCharCode(byte);
}

function isNumber(byte) {
  return byte >= 48 && byte <= 57;
}