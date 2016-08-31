import Peer from './peer';
import announce from './announce';
import { decodePeers } from './announce';
import { read as readTorrentFile } from './../FileOperations/torrentFile';
import { readInfo, readItem } from './../FileOperations/torrentFile';
import urlEncodeBuffer from './../Hashing/urlEncodeBuffer';
import calculateInfoHash from './../Hashing/calculateInfoHash';
import url from 'url';

import { expect } from 'chai';
import chai from 'chai';""
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Peer', () => {
  it('should connect to peer', () => {
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
    const connectPeer = evaluateOperation.then((decodedPeers) => {
      const peerUrl = url.parse('http://' + decodedPeers[0]);
      const peer = new Peer(peerUrl.hostname, peerUrl.port);
      return peer.connect().then(() => peer.disconnect());
    });
    return expect(connectPeer).to.be.fulfilled;
  });
  it('should handshake to peer', () => {
    const torrentPath = './src/FileOperations/test/ubuntu.torrent';
    const torrent = readTorrentFile(torrentPath);
    const rawInfo = readInfo(torrentPath);
    const infohash = calculateInfoHash(rawInfo);
    const encodedInfoHash = urlEncodeBuffer(infohash);

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

    const parseOperation = announce(tracker, options).then(readItem)
      .then((parsedResponse) => decodePeers(parsedResponse.peers));
    const handshakePeer = parseOperation.then((decodedPeers) => {
      const peerUrl = url.parse('http://' + decodedPeers[0]);
      const peer = new Peer(peerUrl.hostname, peerUrl.port);
      return peer.connect().then(() => peer.handshake(infohash).then(() => peer.disconnect()));
    });
    return expect(handshakePeer).to.be.fulfilled;
  });
});