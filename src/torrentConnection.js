import EventEmitter from 'events';
import Pieces from './DataStructures/pieces';
import Piece from './DataStructures/piece';
import TaskAgency from './taskAgency';
import Task from './task';
import Peer from './Connection/peer';
import getPeerAddresses from './Connection/getPeerAddresses';
import urlEncodeBuffer from './Hashing/urlEncodeBuffer';
import url from 'url';
import fs from 'fs';
import path from 'path';

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
  constructor(torrent, configuration) {
    super();
    this.ongoingDiskOperation = 0;
    this.configuration = configuration;
    this.options = CONNECTION_OPTIONS;
    this.state = STATES.PAUSED;
    this.torrent = torrent;
    this.options.infoHash = torrent.infoHash;
    this.options.encodedInfoHash = urlEncodeBuffer(torrent.infoHash);
    this.pieces = new Pieces(torrent.size, torrent.pieceSize);
    this.pieces.once('completed', () => {
      var interval = setInterval(() => {
        if(this.ongoingDiskOperation === 0) {
          saveFilesToDisk(this.torrent, this.pieces, this.configuration.torrentTmpDir);
          clearInterval(interval);
        }
      }, 100);
      this.emit('downloaded');
    });
    const tasks = createTasks(torrent, this.pieces);
    tasks.forEach((task) => {
      task.once('completed', () => {
        this.pieces.add(task.piece);
        this.ongoingDiskOperation++;
        savePieceToDisk(task.piece, this.configuration.torrentTmpDir, (err) => {
          this.ongoingDiskOperation--;
          if(err) {
            console.log(`piece #{piece.index} cannot be saved: #{err}`);
          }
          else {
            task.piece.release();
          }
        });
      });
    });
    this.taskAgency = new TaskAgency(tasks, this.torrent.infoHash, this.options.peerId);
  }

  getPeersFromTrackers() {
    let torrent = this.torrent;
    let options = this.options;
    let taskAgency = this.taskAgency;

    getPeers(this.torrent.trackers, this.options).then(function (decodedPeers) {
      const MAX_ACTIVE_PEERS = 300;
      let maxActivePeers = MAX_ACTIVE_PEERS;
      if (maxActivePeers > decodedPeers.length) {
        maxActivePeers = decodedPeers.length;
      }

      for (let i = 0; i < maxActivePeers; i++) {
        let peerUrl = url.parse('http://' + decodedPeers[i]);
        let peer = new Peer(peerUrl.hostname, peerUrl.port);
        taskAgency.registerPeer(peer);
      }
    });
  }

  createTmpDir() {
    let tmpDir = process.cwd();
    if(this.configuration.tmpDir) {
      try {
        fs.accessSync(tmpDir);
        tmpDir = this.configuration.tmpDir;
      }
      catch(error) {
        console.log(`tmpDir does not exist: #{this.configuraiton.tmpDir}`, 'using cwd...')
      }
    }
    this.configuration.torrentTmpDir = path.join(tmpDir, this.torrent.hashSignature);
    fs.mkdirSync(this.configuration.torrentTmpDir);
  }

  start() {
    if (this.state !== STATES.ACTIVE) {
      this.state = STATES.ACTIVE;

      this.createTmpDir();
      this.refreshPeers = setInterval(() => this.getPeersFromTrackers(), 600000);
      this.getPeersFromTrackers();      
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

function saveFilesToDisk(torrent, pieces, torrentTmpDir) {
  const files = torrent.torrentInfo.info.files;
  let startIndex = 0;
  if (files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      writeToFile(file.path[0], startIndex, file.length, pieces.pieces, torrent.pieceSize, torrentTmpDir);
      console.log('written to ' + file.path[0]);
      startIndex += file.length;
    }
  } else {
    writeToFile(torrent.torrentInfo.info.name, startIndex, torrent.size, pieces.pieces, torrent.pieceSize, torrentTmpDir);
    console.log('written to ' + torrent.torrentInfo.info.name);
  }
}

function writeToFile(filename, startIndex, length, pieces, pieceSize, torrentTmpDir) {
  const fileStream = fs.createWriteStream(filename);

  const startPiece = Math.floor(startIndex / pieceSize);
  const endPiece = Math.floor((startIndex + length) / pieceSize);
  let remaining = length;
  startIndex = startIndex % pieceSize;
  fileStream.write(getPieceData(pieces[startPiece], torrentTmpDir).slice(startIndex));
  if (remaining < pieceSize) {
    remaining = 0;
  } else {
    remaining -= (pieceSize - startIndex);
  }
  for (var i = startPiece + 1; i <= endPiece; i++) {
    if (remaining < pieceSize) {
      fileStream.write(getPieceData(pieces[i], torrentTmpDir), remaining);
      remaining = 0;
      break;
    }
    else {
      fileStream.write(getPieceData(pieces[i], torrentTmpDir));
      remaining -= pieceSize;
    }
  }
  fileStream.end();
  if (remaining !== 0) {
    throw new Error('Incomplete file');
  }
}

function getPieceData(piece, torrentTmpDir) {
  setPieceDataFromFile(piece, torrentTmpDir);
  if(!piece.isIntact()) {
    throw 'Invalid piece #{piece.index} data';
  }
  return piece.buffer;
}

function setPieceDataFromFile(piece, torrentTmpDir) {
  piece.buffer = readPieceFromFile(piece.index, torrentTmpDir);
}

function readPieceFromFile(pieceIndex, torrentTmpDir) {
  let filename = path.join(torrentTmpDir, pieceIndex.toString());
  return fs.readFileSync(filename);
}

function savePieceToDisk(piece, destination, callback) {
  let filename = path.join(destination, piece.index.toString());
  fs.writeFile(filename, piece.buffer, null, callback);
}
