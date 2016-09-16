export function encodeRequest(index, begin, length) {
  const request = new Buffer(17);
  // set length
  request.writeUInt32BE(13, 0);
  // set id
  request.writeUInt8(6, 4);
  request.writeUInt32BE(index, 5);
  request.writeUInt32BE(begin, 9);
  request.writeUInt32BE(length, 13);
  return request;
}