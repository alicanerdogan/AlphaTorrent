import EventEmitter from 'events';
import Pieces from './DataStructures/pieces';
import Piece from './DataStructures/piece';
import TaskAgency from './taskAgency';
import Task from './task';
import Peer from './Connection/peer';
import getPeerAddresses from './Connection/getPeerAddresses';
import urlEncodeBuffer from './Hashing/urlEncodeBuffer';
import url from 'url';

const STATES = {
  ACTIVE: 0,
  PAUSED: 1,
  STOPPED: 2
};

const CONNECTION_OPTIONS = {
  peerId: '-AZ2200-6wfG2wk6wWLc',
  port: '56723',
  uploaded: '0',
  downloaded: '0',
  left: '0',
  event: 'started',
  compact: '1'
};

export default class TorrentConnection extends EventEmitter {
  constructor(torrent) {
    super();
    this.options = CONNECTION_OPTIONS;
    this.state = STATES.PAUSED;
    this.torrent = torrent;
    this.options.infoHash = torrent.infoHash;
    this.options.encodedInfoHash = urlEncodeBuffer(torrent.infoHash);
    this.pieces = new Pieces(torrent.size, torrent.pieceSize);
    this.pieces.once('completed', function () {
      this.emit('downloaded');
    });
    this.taskAgency = new TaskAgency();
    const tasks = createTasks(torrent, this.pieces);
    tasks.forEach((task) => {
      this.taskAgency.enlistTask(task);
      task.once('completed', () => {
        this.pieces.add(task.piece);
      });
    });
  }

  start() {
    if (this.state !== STATES.ACTIVE) {
      this.state = STATES.ACTIVE;

      let torrent = this.torrent;
      let options = this.options;
      let taskAgency = this.taskAgency;

      getPeers(this.torrent.trackers, this.options).then(function(decodedPeers) {
        const MAX_ACTIVE_PEERS = 300;
        let maxActivePeers = MAX_ACTIVE_PEERS;
        if (maxActivePeers > decodedPeers.length) {
          maxActivePeers = decodedPeers.length;
        }

        for (let i = 0; i < maxActivePeers; i++) {
          let peerUrl = url.parse('http://' + decodedPeers[i]);
          let peer = new Peer(peerUrl.hostname, peerUrl.port);
          peer.connectAndHandshake(torrent.infoHash, options.peerId).then(() => {
            taskAgency.requestTask(peer);
          }).catch((error) => {
          });
        }
      });
    }
  }

  stop() {
    if (this.state !== STATES.STOPPED) {
      this.state = STATES.STOPPED;
    }
  }

  pause() {
    if (this.state !== STATES.PAUSED) {
      this.state = STATES.PAUSED;
    }
  }
}

function createTasks(torrent, pieces) {
  let tasks = [];
  let remainingSize = torrent.size;
  for (let i = 0; i < pieces.pieceCount; i++) {
    let currentPieceSize = torrent.pieceSize;
    if (remainingSize < torrent.pieceSize) {
      currentPieceSize = remainingSize;
    }
    remainingSize -= currentPieceSize;
    let piece = new Piece(i, currentPieceSize, getPieceHash(torrent.torrentInfo.info.pieces, i));
    tasks.push(new Task(piece));
  }
  if (remainingSize !== 0) {
    throw new Error('Invalid piece division');
  }
  return tasks;
}

function getPieceHash(hash, index) {
  return Buffer.from(hash.slice(index*20, (index+1)*20));
}

function getPeers(trackers, options) {
  let peers = [];
  const fetchingPeerPromises = trackers.map((tracker) => {
    return getPeerAddresses(tracker, options).then((decodedPeers) => {
      peers = peers.concat(decodedPeers);
    }).catch((error) => {
      console.log(`failed to get peers from ${tracker}: ${error}`);
    });
  });
  return Promise.all(fetchingPeerPromises).then(() => {
    return peers;
  });
}