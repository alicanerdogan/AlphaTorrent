import http from 'http';
import url from 'url';

export default function announce(tracker, options) {
  return new Promise((resolve, reject) => {
    let trackerUrl = url.parse(tracker);

    if (trackerUrl.protocol !== 'http:') {
      throw new Error(`Unknown protocol ${trackerUrl.protocol}`);
    }

    let path = trackerUrl.pathname;
    path += '?';
    path += 'info_hash' + '=' + options.infohash + '&';
    path += 'peer_id' + '=' + options.peerId + '&';
    path += 'port' + '=' + options.port + '&';
    path += 'uploaded' + '=' + options.uploaded + '&';
    path += 'downloaded' + '=' + options.downloaded + '&';
    path += 'left' + '=' + options.left + '&';
    path += 'event' + '=' + options.event;
    if (options.compact) {
      path += '&compact' + '=' + options.compact;
    }

    const requestOptions = {
      hostname: trackerUrl.hostname,
      port: trackerUrl.port,
      path: path,
      method: 'GET'
    };

    const request = http.request(requestOptions, (response) => {
      let body = null;
      //console.log(`STATUS: ${response.statusCode}`);
      response.on('data', (chunk) => {
        body = chunk;
      });
      response.on('end', () => {
        resolve(body);
      });
    });

    request.on('error', (e) => {
      console.log(`problem with request: ${e.message}`);
      reject(e);
    });

    request.end()
  });
}

export function decodePeers(encodedPeers) {
  if (!Buffer.isBuffer(encodedPeers)) {
    throw new Error('encodedPeers is not buffer');
  }
  if (encodedPeers.length % 6 !== 0) {
    throw new Error('Invalid peers size');
  }
  let decodedPeers = [];
  for (var i = 0; i < encodedPeers.length; i=i+6) {
    let decodedPeer = `${encodedPeers[i].toString()}.${encodedPeers[i+1].toString()}.${encodedPeers[i+2].toString()}.${encodedPeers[i+3].toString()}`;
    decodedPeer += ':' + ((encodedPeers[i+4] * 256) + encodedPeers[i+5]).toString();
    decodedPeers.push(decodedPeer);
  }
  return decodedPeers;
}