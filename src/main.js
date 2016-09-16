import Peer from './Connection/peer';
import announce from './Connection/announce';
import { decodePeers } from './Connection/announce';
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
import url from 'url';

const torrentPath = './src/FileOperations/test/ubuntu.torrent';
const torrent = readTorrentFile(torrentPath);
const rawInfo = readInfo(torrentPath);
const infohash = calculateInfoHash(rawInfo);
const encodedInfoHash = urlEncodeBuffer(infohash);
const BLOCK_SIZE = 16384;

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

const pieces = new Pieces(torrent.info['length'], torrent.info['piece length']);
const piece0 = new Piece(torrent.info['piece length'], '');
let index = 0;
let isUnchoked = false;
const parseOperation = announce(tracker, options).then(readItem);
const evaluateOperation = parseOperation.then((parsedResponse) => decodePeers(parsedResponse.peers));
const handshakePeer = evaluateOperation.then((decodedPeers) => {
  const message = encodeHandshake(infohash, options.peerId);
  const peerUrl = url.parse('http://' + decodedPeers[0]);
  const peer = new Peer(peerUrl.hostname, peerUrl.port);
  const connectionTask = peer.connect();
  const subscriberTask = connectionTask.then(() => peer.subscribeData(onDataReceived));
  const sendDataTask = connectionTask.then(() => peer.sendData(message));

  function onDataReceived(data) {
    try {
      const message = parseMessage(data);
      console.log(message);
      if (message.type === 'unchoke') {
        isUnchoked = true;
        const request = encodeRequest(0, index, BLOCK_SIZE);
        peer.sendData(request);
        console.log('block requested');
      }
      else if (message.type === 'handshake') {
        const interested = encodeInterested();
        console.log('interest shown');
        peer.sendData(interested);
      }
      else if (message.type === 'choke') {
        isUnchoked = false;
      }
      else if (message.type === 'piece') {
        piece0.update(index, message.data);
        index += message.data.length;
        if (isUnchoked) {
          if(index < torrent.info['piece length']) {
            let blockSize = BLOCK_SIZE;
            if (BLOCK_SIZE > (torrent.info['piece length'] - index)) {
              blockSize = torrent.info['piece length'] - index;
            }
            const request = encodeRequest(0, index, blockSize);
            peer.sendData(request);
            console.log('block requested');
          }
          else {
            console.log("Piece completed!");
            pieces.add(0, piece0);
          }
        }
      }
    }
    catch (error) {
      console.log(error);
      console.log(data);
    }
  }

});

