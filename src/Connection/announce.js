import http from 'http';
import url from 'url';
import dgram from 'dgram';

export function announce(tracker, options) {
  return new Promise((resolve, reject) => {
    let trackerUrl = url.parse(tracker);

    if (trackerUrl.protocol !== 'http:') {
      throw new Error(`Invalid tracker protocol ${trackerUrl.protocol}`);
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
      response.on('data', (chunk) => {
        body = chunk;
      });
      response.on('end', () => {
        resolve(body);
      });
    });

    request.on('error', (e) => {
      reject(e);
    });

    request.end()
  });
}

export function announceFromUDP(tracker, options) {
  let trackerUrl = url.parse(tracker);

  if (trackerUrl.protocol !== 'udp:') {
    throw new Error(`Invalid tracker protocol ${trackerUrl.protocol}`);
  }

  var connectMessage = Buffer.alloc(16);
  const transactionId = 0x11112222;
  const connectAction = 0x0;
  const announceAction = 0x1;
  
  connectMessage.writeUInt32BE(0x417);
  connectMessage.writeUInt32BE(0x27101980, 4);
  connectMessage.writeUInt32BE(connectAction, 8);
  connectMessage.writeUInt32BE(transactionId, 12);

  var client = dgram.createSocket('udp4');

  const connectionTask = new Promise((resolve, reject) => {
    client.once('message', (response) => {
      if (response.length !== 16) {
        reject('Invalid response size');
      }
      if (response.readUInt32BE(0) !== connectAction) {
        reject('Invalid response action');
      }
      if (response.readUInt32BE(4) !== transactionId) {
        reject('Invalid response transactionId');
      }

      const connectionId = Buffer.from(response.slice(8));
      resolve(connectionId);
    });
    client.send(connectMessage, trackerUrl.port, trackerUrl.hostname, (error) => {
      if (error) {
        reject(error)
      };
    });
  });
  const announceTask = connectionTask.then((connectionId) => {
    const announceMessage = Buffer.alloc(98);
    connectionId.copy(announceMessage);
    announceMessage.writeUInt32BE(0x1, 8);
    announceMessage.writeUInt32BE(transactionId, 12);
    options.infohash.copy(announceMessage, 16);
    Buffer.from(options.peerId).copy(announceMessage, 36);
    announceMessage.writeInt32BE(-1, 92);

    return new Promise((resolve, reject) => {
      client.once('message', (announceResponse) => {
        if (announceResponse.readUInt32BE(0) !== announceAction) {
          reject('Invalid response action');
        }
        if (announceResponse.readUInt32BE(4) !== transactionId) {
          reject('Invalid response transactionId');
        }
        const leechCount = announceResponse.readUInt32BE(12);
        const seedCount = announceResponse.readUInt32BE(16);

        const parsedResponse = {
          leechCount: announceResponse.readUInt32BE(12),
          seedCount: announceResponse.readUInt32BE(16),
          peers: decodePeers(announceResponse.slice(20))
        };
        client.close();
        resolve(parsedResponse);
      });

      client.send(announceMessage, trackerUrl.port, trackerUrl.hostname, (err) => {
        if (err) throw err;
      });
    });
  })
  return announceTask;
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