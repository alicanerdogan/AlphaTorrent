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
      this.client = net.connect(options, () => {
        this.subscribeData((data) => {
          const message = parseMessage(data);
          if (message) {
            if (message.type === 'unchoke') {
              this.isUnchoked = true;
              console.log(`${this.ip}:${this.port} is unchoked`);
              this.emit('unchoked');
            }
            else if (message.type === 'choke') {
              this.isUnchoked = false;
              console.log(`${this.ip}:${this.port} is choked`);
              this.emit('choked');
            }
          }
        });
        resolve();
      });
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
      const waitForHandshake = this.waitForResponse().then((data) => {
        return new Promise((resolve, reject) => {
          const message = parseMessage(data);
          if (message.type === 'handshake') {
            console.log(`handshaked with ${this.ip}:${this.port}`);
            const interested = encodeInterested();
            this.sendData(interested);
            console.log('interest shown');
            resolve();
          }
          else {
            console.log('handshake is not received');
            reject();
          }
        });
      });
      this.sendData(handshake);
      return waitForHandshake;
    });
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

  subscribeData(dataCallback) {
    this.client.on('data', dataCallback);
  }

  unsubscribeData(dataCallback) {
    this.client.removeListener('data', dataCallback);
  }

  waitForResponse() {
    return new Promise((resolve, reject) => {
      this.client.once('data', (data) => {
        resolve(data);
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
