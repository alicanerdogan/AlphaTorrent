import Peer from './peer';
import { announce, decodePeers } from './announce';
import { read as readTorrentFile } from './../FileOperations/torrentFile';
import { readInfo, readItem } from './../FileOperations/torrentFile';
import urlEncodeBuffer from './../Hashing/urlEncodeBuffer';
import calculateInfoHash from './../Hashing/calculateInfoHash';
import { encodeHandshake } from './Messages/handshake';
import parseMessage from './Messages/parseMessage';
import url from 'url';

import { expect } from 'chai';
import chai from 'chai';""
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Peer', function() {
  this.timeout(5000);

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
  it('should send data to peer', () => {
    let torrentPath = './src/FileOperations/test/ubuntu.torrent';
    let torrent = readTorrentFile(torrentPath);
    let rawInfo = readInfo(torrentPath);
    let infohash = calculateInfoHash(rawInfo);
    let encodedInfoHash = urlEncodeBuffer(infohash);

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
    const handshakePeer = evaluateOperation.then((decodedPeers) => {
      const message = encodeHandshake(infohash, options.peerId);
      const peerUrl = url.parse('http://' + decodedPeers[0]);
      const peer = new Peer(peerUrl.hostname, peerUrl.port);
      const connectionTask = peer.connect();
      const waitForResponseTask = connectionTask.then(() => peer.waitForResponse());
      const sendDataTask = connectionTask.then(() => peer.sendData(message));
      const parseTask = waitForResponseTask.then((data) => {
        const message = parseMessage(data);
        expect(message.infohash.equals(infohash)).to.be.ok;
      });
      const disconnectTask = parseTask.then(() => peer.disconnect());
      return disconnectTask;
    });
    return expect(handshakePeer).to.be.fulfilled;
  });
});