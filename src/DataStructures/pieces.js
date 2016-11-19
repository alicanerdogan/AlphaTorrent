import EventEmitter from 'events';
import fs from 'fs';

export default class Pieces extends EventEmitter {
  constructor(totalSize, pieceSize) {
    super();
    this.pieceCount = Math.ceil(parseFloat(totalSize)/pieceSize);
    this.pieces = [];
    this.pieceSize = pieceSize;
    this.totalSize = totalSize;
    this.completed = 0;
  }

  add(piece) {
    if (piece.index < 0 || piece.index >= this.pieceCount) {
      throw new Error(`Invalid piece index: ${piece.index}`);
    }
    this.pieces[piece.index] = piece;
    this.completed++;
    if (this.isCompleted()) {
      console.log('COMPLETED PIECES!');
      this.emit('completed');
    }
    console.log((`Completed piece count: ${this.completed}/${this.pieceCount} Completed piece index: ${piece.index}`));
  }

  isCompleted() {
    return this.completed === this.pieceCount;
  }
}
