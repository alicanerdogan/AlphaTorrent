import EventEmitter from 'events';
import { encodeRequest } from './Connection/Messages/request';
import parseMessage from './Connection/Messages/parseMessage';

export default class Task extends EventEmitter {
    constructor(piece) {
        super();
        this.piece = piece;
        this.index = 0;
        this.BLOCK_SIZE = 1024;
    }

    assignTo(peer) {
        this.onDataReceivedCallback = (data) => this.onDataReceived(data);
        this.onPeerChokedCallback = () => this.onPeerChoked();
        this.onPeerDisconnectedCallback = () => this.onPeerDisconnected();
        this.peer = peer;

        this.peer.once('disconnected', this.onPeerDisconnectedCallback);
        this.peer.once('choked', this.onPeerChokedCallback);
        this.peer.subscribeData(this.onDataReceivedCallback);
        this.timeout = setTimeout(() => {
            peer.unsubscribeData(this.onDataReceivedCallback);
            peer.removeListener('choked', this.onPeerChokedCallback);
            peer.removeListener('disconnected', this.onPeerDisconnectedCallback);
            this.emit('terminated');
        }, 5000);
        let request = encodeRequest(this.piece.index, this.index, this.BLOCK_SIZE);
        this.peer.sendData(request);
    }

    onPeerChoked() {
        this.peer.unsubscribeData(this.onDataReceivedCallback);
        this.peer.removeListener('disconnected', this.onPeerDisconnectedCallback);
        this.emit('suspended');
    }

    onPeerDisconnected() {
        this.peer.unsubscribeData(this.onDataReceivedCallback);
        this.peer.removeListener('choked', this.onPeerChokedCallback);
        this.emit('terminated');
    }

    onDataReceived(data) {
        try {
            let message = parseMessage(data);
            if (message && message.type === 'piece') {
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
                        this.peer.unsubscribeData(this.onDataReceivedCallback);
                        this.peer.removeListener('choked', this.onPeerChokedCallback);
                        this.peer.removeListener('disconnected', this.onPeerDisconnectedCallback);
                        this.emit('terminated');
                    }, 5000);
                }
                else {
                    if(this.piece.isIntact()) {
                        this.peer.unsubscribeData(this.onDataReceivedCallback);
                        this.peer.removeListener('choked', this.onPeerChokedCallback);
                        this.peer.removeListener('disconnected', this.onPeerDisconnectedCallback);
                        this.emit('completed');
                    }
                    else {
                        console.log(`Piece #${this.piece.index} is corrupted`);
                        this.peer.unsubscribeData(this.onDataReceivedCallback);
                        this.peer.removeListener('choked', this.onPeerChokedCallback);
                        this.peer.removeListener('disconnected', this.onPeerDisconnectedCallback);
                        this.emit('suspended');
                    }
                }
            }
        }
        catch (error) {
            console.log(`Invalid data received: ${error}`);
        }
    }
}