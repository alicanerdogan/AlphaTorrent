import EventEmitter from 'events';

export default class Pieces extends EventEmitter {
  constructor(totalSize, pieceSize) {
    super();
    this.pieceCount = Math.ceil(parseFloat(totalSize)/pieceSize);
    this.pieces = [];
    console.log(`Total Size: ${totalSize}`);
    console.log(`Piece count: ${this.pieceCount}`);
  }

  add(index, piece) {
    if (index < 0 || index >= this.pieceCount) {
      throw new Error(`Invalid piece index: ${index}`);
    }
    this.pieces[index] = piece;
    if (this.isCompleted()) {
      this.emit('completed');
    }
  }

  isCompleted() {
    return this.pieces.length === this.pieceCount;
  }
}
