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

  sendData(data, sentCallback) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('message is not buffer');
    }

    return new Promise((resolve, reject) => {
      let onSentCallback = undefined;
      if (sentCallback) {
        onSentCallback = () => sentCallback();
      }
      this.client.write(data, onSentCallback);
    });
  }

  subscribeData(dataCallback) {
    this.client.on('data', dataCallback);
  }

  unsubscribeData(dataCallback) {
    this.client.removeListener('data', dataCallback);
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      this.client.on('close', () => {
        resolve();
      });
      this.client.removeAllListeners('data');
      this.client.destroy();
      this.client = null;
    });
  }
}
