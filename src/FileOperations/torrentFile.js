import Torrent from '../DataStructures/torrent';
import fs from 'fs';

export function read(torrentPath) {
  let fileBuffer = fs.readFileSync(torrentPath);
  return readItem(fileBuffer, 0);
}

function readItem(buffer, index) {
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

export function readDictionary(buffer, index) {
  if(byteToChar(buffer[index]) !== 'd')
  {
    throw new Error('Invalid buffer data: missing prefix \'d\'');
  }

  let dictionary = {};

  index++;
  while (byteToChar(buffer[index]) !== 'e') {
    let keyValuePair = readKeyValuePair(buffer, index);
    dictionary[keyValuePair[0]] = keyValuePair[1];
    let size = getSizeOfKeyValuePair(keyValuePair);
    index += size;
  }

  return dictionary;
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
  let key = readItem(buffer, index).toString();

  index += key.length + (key.length.toString()).length + 1;
  let value = readItem(buffer, index);

  if(key !== "pieces" && Buffer.isBuffer(value)) {
    value = value.toString();
  }
  return [key, value];
}

export function readString(buffer, index) {
  let lengthAsString = '';

  while (isNumber(buffer[index])) {
    lengthAsString += byteToChar(buffer[index]);
    index++;
  }

  if (byteToChar(buffer[index]) !== ':') {
    throw new Error('Invalid buffer data: missing colon in string');
  }

  index++;

  let length = parseInt(lengthAsString);

  return buffer.slice(index, index + length);
}

export function readList(buffer, index) {
  if(byteToChar(buffer[index]) !== 'l')
  {
    throw new Error('Invalid buffer data: missing prefix \'l\'');
  }

  let list = [];

  index++;
  while (byteToChar(buffer[index]) !== 'e') {
    let item = readItem(buffer, index);
    if(Buffer.isBuffer(item)) {
      item = item.toString();
    }
    list.push(item);
    let size = getSizeOf(item);
    index += size;
  }

  return list;
}

function byteToChar(byte) {
  return String.fromCharCode(byte);
}

function isNumber(byte) {
  return byte >= 48 && byte <= 57;
}

function getSizeOfKeyValuePair(keyValuePair) {
  let key = keyValuePair[0];
  let value = keyValuePair[1];
  return getSizeOf(key) + getSizeOf(value);
}

function getSizeOf(item) {
  let type = typeof(item);
  if (type === 'string') {
    return Buffer.from(item).length + Buffer.from(item).length.toString().length + 1;
  }
  else if (type === 'number') {
    return item.toString().length + 2;
  }
  else if (Array.isArray(item)) {
    let size = 0;
    item.forEach((arrayItem) => size += getSizeOf(arrayItem));
    return size + 2;
  }
  else if (Buffer.isBuffer(item)) {
    return item.length + item.length.toString().length + 1;
  }
  else if (type === 'object') {
    let size = 0;
    Object.keys(item).forEach((key) => size += getSizeOfKeyValuePair([key, item[key]]));
    return size + 2;
  }
  else {
    throw new Error(`Undefined type: ${type}`)
  }
}