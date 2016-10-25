import { announce, announceFromUDP, decodePeers } from './announce';
import { readItem } from './../FileOperations/torrentFile';

export default function getPeerAddresses(tracker, options) {
  if(tracker.indexOf('udp:') === 0) {
    return announceFromUDP(tracker, options).then((announceResponse) => {
      return announceResponse.peers;
    });
  }
  else if(tracker.indexOf('http:') === 0){
    return announce(tracker, options).then((announceResponse) => {
      return decodePeers(readItem(announceResponse).peers);
    });
  }
  else {
    return [];
  }
}