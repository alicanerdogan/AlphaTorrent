import { read as readTorrentFile } from './FileOperations/torrentFile';
import { readInfo } from './FileOperations/torrentFile';
import calculateInfoHash from './Hashing/calculateInfoHash';

export default class Torrent {
  constructor(uri) {
    if(isMagnetLink(uri)) {
      throw new Error('Unsupported uri: magnet');
    }
    else {
      this.torrentInfo = readTorrentFile(uri);
      this.infoHash = getInfoHash(uri);
    }
    this.pieceSize = this.torrentInfo.info['piece length'];
    this.trackers = getTrackers(this.torrentInfo);
    this.size = getTorrentSize(this.torrentInfo);
    this.pieceCount = Math.ceil(parseFloat(this.size)/this.pieceSize);
    this.sizeAsString = getSizeAsString(this.size);
    this.name = this.torrentInfo.info.name;
    this.files = this.torrentInfo.info.files ? 
      this.torrentInfo.info.files.map((file) => file.path[0]) : 
      [this.torrentInfo.info.name];
    this.hashSignature = createHashSignature(this.infoHash);
  }
}

function createHashSignature(infoHash) {
  return infoHash.reduce((signature, byte) => signature += ("00" + byte.toString(16)).substr(-2), '');
}

function isMagnetLink(uri) {
  return uri.substring(0, 8) === 'magnet://';
}

function getInfoHash(uri) {
    const rawInfo = readInfo(uri);
    return calculateInfoHash(rawInfo);
}

function getTrackers(torrent) {
  let trackers = [];
  trackers.push(torrent.announce);
  if (torrent['announce-list']) {
    torrent['announce-list'].forEach((announceList) => {
      announceList.forEach((tracker) => {
        if (trackers.indexOf(tracker) === -1) {
          trackers.push(tracker);
        }
      });
    });
  }
  return trackers;
}

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
  return size;
}

let UNIT_LIST = ['bytes', 'KB', 'MB', 'GB', 'TB'];

function getSizeAsString(size) {
  let unitIndex = 0;
  while (size >= 1000 && unitIndex < UNIT_LIST.length) {
    size = size/1024;
    unitIndex++;
  }
  return size.toFixed(2) + ' ' + UNIT_LIST[unitIndex];
}
