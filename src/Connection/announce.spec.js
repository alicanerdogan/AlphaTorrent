import announce from './announce';
import { decodePeers } from './announce';
import { read as readTorrentFile } from './../FileOperations/torrentFile';
import { readInfo, readItem } from './../FileOperations/torrentFile';
import urlEncodeBuffer from './../Hashing/urlEncodeBuffer';
import calculateInfoHash from './../Hashing/calculateInfoHash';

import { expect } from 'chai';
import chai from 'chai';""
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Announcing trackers', () => {
  it('should get response from debian tracker', () => {
    const tracker = 'http://bttracker.debian.org:6969/announce';
    const options = {
      infohash: 'b%0cW%13%08%ee=K??%08%11%aa%ef%0cE6%1b)%a5',
      peerId: '-AZ2200-6wfG2wk6wWLc',
      port: '56723',
      uploaded: '0',
      downloaded: '0',
      left: '0',
      event: 'started'
    }
    return expect(announce(tracker, options)).to.be.fulfilled;
  });
  it('should get response from tracker using torrent file', () => {
    let torrentPath = './src/FileOperations/test/debian.torrent';
    let torrent = readTorrentFile(torrentPath);
    let rawInfo = readInfo(torrentPath);
    let encodedInfoHash = urlEncodeBuffer(calculateInfoHash(rawInfo));

    const tracker = torrent.announce;
    const options = {
      infohash: encodedInfoHash,
      peerId: '-AZ2200-6wfG2wk6wWLc',
      port: '56723',
      uploaded: '0',
      downloaded: '0',
      left: '0',
      event: 'started'
    }
    return expect(announce(tracker, options)).to.be.fulfilled;
  });
  it('should parse response from tracker using torrent file', () => {
    let torrentPath = './src/FileOperations/test/debian.torrent';
    let torrent = readTorrentFile(torrentPath);
    let rawInfo = readInfo(torrentPath);
    let encodedInfoHash = urlEncodeBuffer(calculateInfoHash(rawInfo));

    const tracker = torrent.announce;
    const options = {
      infohash: encodedInfoHash,
      peerId: '-AZ2200-6wfG2wk6wWLc',
      port: '56723',
      uploaded: '0',
      downloaded: '0',
      left: '0',
      event: 'started',
      compact: '1'
    }

    return expect(announce(tracker, options).then(readItem)
      .then((res) => res.interval)).eventually.to.equal(900);
  });
  it('should parse peers from tracker using torrent file', () => {
    let torrentPath = './src/FileOperations/test/ubuntu.torrent';
    let torrent = readTorrentFile(torrentPath);
    let rawInfo = readInfo(torrentPath);
    let encodedInfoHash = urlEncodeBuffer(calculateInfoHash(rawInfo));

    const tracker = torrent.announce;
    const options = {
      infohash: encodedInfoHash,
      peerId: '-AZ2200-6wfG2wk6wWLc',
      port: '56723',
      uploaded: '0',
      downloaded: '0',
      left: '0',
      event: 'started',
      compact: '1'
    }

    const parseOperation = announce(tracker, options).then(readItem);
    const evaluateOperation = parseOperation.then((parsedResponse) => decodePeers(parsedResponse.peers));

    return expect(evaluateOperation).to.be.fulfilled;
  });
});