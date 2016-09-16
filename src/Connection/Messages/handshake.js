export function decodeHandshake(data) {
  if (!Buffer.isBuffer(data)) {
    throw new Error('data is not buffer');
  }

  if (data[0] != 19) {
    throw new Error('invalid handshake');
  }

  return {
    type: 'handshake',
    protocol: data.toString('ascii', 1, 20),
    flags: data.slice(20, 28),
    infohash: data.slice(28, 48),
    id: data.toString('ascii', 48)
  }
}

export function encodeHandshake(infohash, id) {
  if (!Buffer.isBuffer(infohash)) {
    throw new Error('infohash is not buffer');
  }

  if (infohash.length !== 20) {
    throw new Error('invalid infohash');
  }

  let handshakeMessage = new Buffer(68);
  handshakeMessage[0] = 19;

  const protocolName = Buffer.from('BitTorrent protocol', 'utf8');

  protocolName.copy(handshakeMessage, 1);
  infohash.copy(handshakeMessage, 28);
  Buffer.from(id, 'utf8').copy(handshakeMessage, 48);

  return handshakeMessage;
}