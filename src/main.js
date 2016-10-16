import Peer from './Connection/peer';
import getPeerAddresses from './Connection/getPeerAddresses';
import { read as readTorrentFile } from './FileOperations/torrentFile';
import { readInfo, readItem } from './FileOperations/torrentFile';
import urlEncodeBuffer from './Hashing/urlEncodeBuffer';
import calculateInfoHash from './Hashing/calculateInfoHash';
import { encodeHandshake } from './Connection/Messages/handshake';
import { encodeRequest } from './Connection/Messages/request';
import { encodeInterested } from './Connection/Messages/interested';
import parseMessage from './Connection/Messages/parseMessage';
import Pieces from './DataStructures/pieces';
import Piece from './DataStructures/piece';
import TaskAgency from './taskAgency';
import Task from './task';
import url from 'url';

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});

function getTorrentSize(torrent) {
  let size = 0;
  if(torrent.info.files) {
    for (var i = 0; i < torrent.info.files.length; i++) {
      size += torrent.info.files[i].length;
    }
  }
  else {
    size = torrent.info.length;
  }
  console.log(`Size: ${(size/(1024.0*1024)).toFixed(2)}mb`);
  return size;
}

function getPieceHash(hash, index) {
  return Buffer.from(hash.slice(index*20, (index+1)*20));
}

const torrentPath = './src/FileOperations/test/ubuntu.torrent';
const torrent = readTorrentFile(torrentPath);
const rawInfo = readInfo(torrentPath);
const infohash = calculateInfoHash(rawInfo);
const BLOCK_SIZE = 16384;

console.log('l: ' + torrent.info.pieces.length);

const tracker = torrent.announce;
const options = {
  infohash: infohash,
  peerId: '-AZ2200-6wfG2wk6wWLc',
  port: '56723',
  uploaded: '0',
  downloaded: '0',
  left: '0',
  event: 'started',
  compact: '1'
}

const torrentSize = getTorrentSize(torrent);
const pieces = new Pieces(torrentSize, torrent.info['piece length']);
pieces.once('completed', () => {
  const files = torrent.info.files;
  let startIndex = 0;
  if (files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      pieces.writeToFile(file.path[0], startIndex, file.length);
      console.log('written to ' + file.path[0]);
      startIndex += file.length;
    }
  } else {
    pieces.writeToFile(torrent.info.name, startIndex, torrentSize);
    console.log('written to ' + torrent.info.name);
  }

});
const taskAgency = new TaskAgency();
let remainingSize = torrentSize;
for(let i=0; i<pieces.pieceCount; i++) {
  let pieceSize = torrent.info['piece length'];
  if(remainingSize < torrent.info['piece length']) {
    pieceSize = remainingSize;
  }
  remainingSize -= pieceSize;
  let piece = new Piece(i, pieceSize, getPieceHash(torrent.info.pieces, i));
  let task = new Task(piece);
  taskAgency.enlistTask(task);
  task.once('completed', () => {
    pieces.add(i, piece);
    if (pieces.isCompleted()) {
      console.log('COMPLETED!');
    }
  });
}

if(remainingSize !== 0) {
  throw new Error('Invalid piece division');
}

const handshakePeer = getPeerAddresses(tracker, options).then((decodedPeers) => {
  console.log(`Total peer count: ${decodedPeers.length}`); 
  const MAX_ACTIVE_PEERS = 75;
  let maxActivePeers = MAX_ACTIVE_PEERS;
  if (maxActivePeers > decodedPeers.length) {
    maxActivePeers = decodedPeers.length;
  }
  
  for(let i=0; i<maxActivePeers; i++) {
    let peerUrl = url.parse('http://' + decodedPeers[i]);
    let peer = new Peer(peerUrl.hostname, peerUrl.port);
    peer.connectAndHandshake(infohash, options.peerId).then(() => {
      taskAgency.requestTask(peer);
    }).catch((error) => {
      // console.log(error);
    });
  }
});

