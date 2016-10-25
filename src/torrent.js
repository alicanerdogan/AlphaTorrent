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
  }
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
