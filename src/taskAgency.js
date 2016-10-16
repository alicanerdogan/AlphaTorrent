export default class TaskAgency {
  constructor() {
    this.availableTasks = [];
    this.waitingPeers = [];
  }

  requestTask(peer) {
    if(peer.isUnchoked) {
      if (this.isAnyTaskAvailable()) {
        let task = this.enqueueTask();
        this.assignPeerToTask(peer, task);
      }
      else {
        this.waitingPeers.push(peer);
      }
    }
    else {
      peer.once('unchoked', () => {
        if (this.isAnyTaskAvailable()) {
          let task = this.enqueueTask();
          this.assignPeerToTask(peer, task);
        }
        else {
          console.log(`No task available ${this.availableTasks.length}`);
          this.waitingPeers.push(peer);
        }
      });
    }
  }

  enlistTask(task) {
    this.availableTasks.push(task);
    task.once('completed', () => {
      this.requestTask(task.peer);
    });
  }

  enqueueTask() {
    return this.availableTasks.shift();
  }

  assignPeerToTask(peer, task) {
    task.assignTo(peer);
    task.once('suspended', () => {
      console.log('task has been suspended');
      this.availableTasks.push(task);
      this.reassignTask();
      this.requestTask(peer);
    });
    task.once('terminated', () => {
      console.log('task has been terminated');
      this.availableTasks.push(task);
      this.reassignTask();
    });
  }

  reassignTask() {
    let peer = this.waitingPeers.shift();
    if (peer) {
      this.assignPeerToTask(peer, this.enqueueTask());
    } else {
      console.log('Peers have been depleted.');
    }
  }

  isAnyTaskAvailable() {
    return this.availableTasks.length > 0;
  }
}