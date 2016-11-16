import EventEmitter from 'events';
import { encodeRequest } from './Connection/Messages/request';
import parseMessage from './Connection/Messages/parseMessage';

export default class Task extends EventEmitter {
  constructor(piece) {
    super();
    this.piece = piece;
    this.index = 0;
    this.BLOCK_SIZE = 16384;
    if (this.BLOCK_SIZE > this.piece.size) {
      this.BLOCK_SIZE = this.piece.size;
    }
  }

  assignTo(peer) {
    this.onDataReceivedCallback = (data) => this.onMessageReceived(data);
    this.onPeerChokedCallback = () => this.onPeerChoked();
    this.onPeerDisconnectedCallback = () => this.onPeerDisconnected();
    this.peer = peer;

    this.peer.on('disconnected', this.onPeerDisconnectedCallback);
    this.peer.on('choked', this.onPeerChokedCallback);
    this.peer.on('message', this.onDataReceivedCallback);
    this.timeout = setTimeout(() => {
      this.unsubscribePeerEvents();
      this.emit('suspended');
    }, 5000);
    let request = encodeRequest(this.piece.index, this.index, this.BLOCK_SIZE);
    this.peer.sendData(request);
  }

  unsubscribePeerEvents() {
    this.peer.removeListener('message', this.onDataReceivedCallback);
    this.peer.removeListener('choked', this.onPeerChokedCallback);
    this.peer.removeListener('disconnected', this.onPeerDisconnectedCallback);
  }

  onPeerChoked() {
    this.unsubscribePeerEvents();
    this.emit('suspended');
  }

  onPeerDisconnected() {
    this.unsubscribePeerEvents();
    this.emit('suspended');
  }

  onMessageReceived(message) {
    if (message.type === 'piece') {
      clearTimeout(this.timeout);
      if (message.begin !== this.index) throw new Error('invalid begin');
      if (message.index !== this.piece.index) throw new Error('invalid piece index');
      this.piece.update(this.index, message.data);
      this.index += message.data.length;
      if (this.index < this.piece.size) {
        let blockSize = this.BLOCK_SIZE;
        if (this.BLOCK_SIZE > (this.piece.size - this.index)) {
          blockSize = this.piece.size - this.index;
        }
        const request = encodeRequest(this.piece.index, this.index, blockSize);
        this.peer.sendData(request);
        this.timeout = setTimeout(() => {
          this.unsubscribePeerEvents();
          this.emit('suspended');
        }, 5000);
      }
      else {
        if (this.piece.isIntact()) {
          this.unsubscribePeerEvents();
          this.emit('completed');
        }
        else {
          console.log(`Piece #${this.piece.index} is corrupted`);

          this.index = 0;
          this.emit('suspended');
        }
      }
    }
  }
}