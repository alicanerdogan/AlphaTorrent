export function encodeInterested() {
  const interested = new Buffer(5);
  // set length
  interested.writeUInt32BE(1, 0);
  // set id
  interested.writeUInt8(2, 4);
  return interested;
}