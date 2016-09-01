import { decodeHandshake } from './handshake';

export default function dispatchMessage(data) {
  if (!Buffer.isBuffer(data)) {
    throw new Error('data is not buffer');
  }

  let message = null;
  if (data[0] === 19) {
    message = decodeHandshake(data);
  }
  else if (data.length === 4) {
    message = {
      type: 'keep-alive'
    };
  }
  else {
    const length = data.readUInt32BE(0);
    const id = data[4];
    switch (id) {
      case 0:
        message = {
          type: 'choke'
        };
        break;
      case 1:
        message = {
          type: 'unchoke'
        };
        break;
      case 2:
        message = {
          type: 'interested'
        };
        break;
      case 3:
        message = {
          type: 'not-interested'
        };
        break;
      case 4:
        message = {
          type: 'have',
          index: data.readUInt32BE(5)
        };
        break;
      case 5:
        message = {
          type: 'bitfield',
          bits: []
        };
        for (let i = 5; i < length; i = i + 4) {
          message.bits.push(data.readUInt32BE(i));
        }
        break;
      case 6:
        message = {
          type: 'request',
          index: data.readUInt32BE(5),
          begin: data.readUInt32BE(9),
          length: data.readUInt32BE(13)
        };
        break;
      case 7:
        message = {
          type: 'piece',
          index: data.readUInt32BE(5),
          begin: data.readUInt32BE(9),
          length: data.readUInt32BE(13)
        };
        break;
      case 8:
        message = {
          type: 'cancel',
          index: data.readUInt32BE(5),
          begin: data.readUInt32BE(9),
          data: new Buffer(length - 9)
        };
        for (let i = 13; i < length; i++) {
          message.data[i] = data[i];
        }
        break;
      case 9:
        message = {
          type: 'port',
          listenPort: data.readUInt16BE(5)
        };
        break;
    }
  }

  return message;
}