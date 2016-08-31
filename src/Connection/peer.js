var net = require('net');

export default class Peer {
  constructor(ip, port) {
    this.ip = ip;
    this.port = parseInt(port);
  }

  connect() {
    return new Promise((resolve, reject) => {
      const options = {
        port: this.port,
        host: this.ip
      };
      this.client = net.connect(options, () => {
        resolve();
      });
    });
  }

  handshake(infohash) {
    return new Promise((resolve, reject) => {
      let handshakeMessage = new Buffer(68);
      handshakeMessage[0] = 19;

      const protocolName = Buffer.from('BitTorrent protocol', 'utf8');
      const id = Buffer.from([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

      protocolName.copy(handshakeMessage, 1);
      infohash.copy(handshakeMessage, 28);
      id.copy(handshakeMessage, 48);

      this.client.write(handshakeMessage);

      this.client.on('data', (response) => {
        resolve(response);
      });
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      this.client.on('close', () => {
        resolve();
      });

      this.client.destroy();
    });
  }
}
