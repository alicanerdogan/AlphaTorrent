import net from 'net';
import EventEmitter from 'events';
import { encodeHandshake } from './Messages/handshake';
import { encodeInterested } from './Messages/interested';
import parseMessage from './Messages/parseMessage';

export default class Peer extends EventEmitter {
  constructor(ip, port) {
    super();
    this.ip = ip;
    this.port = parseInt(port);
    this.isUnchoked = false;
    this.buffer = Buffer.alloc(0);
  }

  connect() {
    setTimeout(() => {
      if (this.client.connecting) {
        this.client.destroy();
      }
    }, 2000);
    return new Promise((resolve, reject) => {
      const options = {
        port: this.port,
        host: this.ip
      };
      this.client = net.createConnection(options, () => {
        this.on('message', (message) => this.onMessage(message));
        resolve();
      });
      this.client.on('data', (data) => this.onData(data));
      this.client.once('error', (error) => {
        reject(`connection error on ${error}@${this.ip}:${this.port}`);
      });
      this.client.once('close', (had_error) => {
        reject(`connection closed on ${this.ip}:${this.port}`);
      });

    });
  }

  connectAndHandshake(infohash, id) {
    return this.connect().then(() => {
      console.log(`connected to ${this.ip}:${this.port}`);
      const handshake = encodeHandshake(infohash, id);
      const waitForHandshake = this.waitForResponse().then((message) => {
        return new Promise((resolve, reject) => {
          if (message.type === 'handshake') {
            const interested = encodeInterested();
            this.sendData(interested);
            resolve();
          }
          else {
            reject();
          }
        });
      });
      this.sendData(handshake);
      return waitForHandshake;
    });
  }

  getSignature() {
    return `${this.ip}:${this.port}`;
  }

  onData(data) {
    function handleReceivedData(buffer, callback) {
      if (buffer.length < 4) {
        return buffer;
      }
      let messageLength = buffer.readUInt32BE(0) + 4;
      if (messageLength <= buffer.length) {
        callback(buffer.slice(0, messageLength));
        return handleReceivedData(buffer.slice(messageLength), callback);
      } else {
        return buffer;
      }
    }

    const dataCallback = (data) => {
      const receivedMessage = parseMessage(data);
      if(receivedMessage) {
        this.emit('message', receivedMessage);
      }
    };

    this.buffer = Buffer.concat([this.buffer, data]);

    if (this.buffer[0] === 19) {
      if (this.buffer.length >= 68) {
        dataCallback(this.buffer.slice(0, 68));
        this.buffer = handleReceivedData(this.buffer.slice(68), dataCallback);
      }
    } else {
      this.buffer = handleReceivedData(this.buffer, dataCallback);
    }
  }

  onMessage(message) {
    if (message.type === 'unchoke') {
      this.isUnchoked = true;
      this.emit('unchoked');
    }
    else if (message.type === 'choke') {
      this.isUnchoked = false;
      this.emit('choked');
    }
  }

  sendData(data, sentCallback) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('message is not buffer');
    }

    let onSentCallback = undefined;
    if (sentCallback) {
      onSentCallback = () => sentCallback();
    }
    this.client.write(data, onSentCallback);
  }

  waitForResponse() {
    return new Promise((resolve, reject) => {
      this.once('message', (message) => {
        resolve(message);
      });
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      this.client.once('close', () => {
        resolve();
      });
      this.client.removeAllListeners('data');
      this.client.destroy();
      this.client = null;
    });
  }
}
