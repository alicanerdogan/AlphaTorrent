const MAX_ACTIVE_PEER_COUNT = 30;
const RESURRECT_IN_MS = 30000;

export default class TaskAgency {
  constructor(tasks, infohash, clientId) {
    if(!Array.isArray(tasks) || tasks.length <= 0) {
      throw new Error('Invalid argument: tasks');
    }

    this.tasks = tasks.slice();
    this.infohash = infohash;
    this.clientId = clientId;

    this.registeredPeers = {};
    this.deadPeers = [];
    this.limbo = {};
    this.waitingPeers = [];

    this.subscribeTaskEvents();
    this.ressurrectionInterval = setInterval(() => this.resurrectPeers(), RESURRECT_IN_MS);
  }

  getActivePeerCount() {
    return Object.keys(this.registeredPeers).length - Object.keys(this.limbo).length - this.deadPeers.length;
  }

  resurrectPeers() {
    if(this.getActivePeerCount() < MAX_ACTIVE_PEER_COUNT) {
      while(this.deadPeers.length > 0) {
        process.nextTick(() => {
          let deadPeer = this.deadPeers.pop();
          this.establishPeerConnection(deadPeer);
        });
        if(this.getActivePeerCount() < MAX_ACTIVE_PEER_COUNT) break;
      }
    }
  }

  subscribeTaskEvents() {
    this.tasks.forEach((task) => {
      task.on('suspended', () => this.tasks.push(task));
      task.on('completed', () => this.assignPeerToTask(task.peer));
    });
  }

  registerPeer(peer) {
    if (!this.registeredPeers[peer.getSignature()]) {
      this.sendPeerToLimbo(peer);

      peer.on('choked', () => this.sendPeerToLimbo(peer));
      peer.on('unchoked', () => this.assignPeerToTask(peer));
      peer.on('disconnected', () => this.sendPeerToDead(peer));

      this.establishPeerConnection(peer);
    }
  }

  establishPeerConnection(peer) {
    peer.connectAndHandshake(this.infohash, this.clientId).then(() => {
      this.callPeerFromLimbo(peer);
      // assign task
    }).catch((error) => {
      this.sendPeerToDead(peer);
    });
  }

  assignPeerToTask(peer) {
    this.callPeerFromLimbo(peer);
    if(this.tasks.length > 0) {
      let task = this.tasks.pop();
      task.assignTo(peer);
    }
  }

  sendPeerToLimbo(peer) {
    this.limbo[peer.getSignature()] = true;
  }

  sendPeerToDead(peer) {
    this.callPeerFromLimbo(peer);
    this.deadPeers.push(peer);
  }

  callPeerFromLimbo(peer) {
    let peerSignature = peer.getSignature();
    if(this.limbo[peerSignature]) delete this.limbo[peerSignature];
  }
}