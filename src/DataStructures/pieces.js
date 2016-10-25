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

  writeToFile(filename, startIndex, length) {
    const fileStream = fs.createWriteStream(filename);
    
    const startPiece = Math.floor(startIndex/this.pieceSize);
    const endPiece = Math.floor((startIndex+length)/this.pieceSize);
    let remaining = length;
    startIndex = startIndex % this.pieceSize;
    fileStream.write(this.pieces[startPiece].buffer.slice(startIndex));
    if(remaining < this.pieceSize) {
      remaining = 0;
    } else {
      remaining -= (this.pieceSize - startIndex);
    }  
    for (var i = startPiece + 1; i <= endPiece; i++) {
      if(remaining < this.pieceSize) {
        fileStream.write(this.pieces[i].buffer, remaining);
        remaining = 0;
        break;
      }
      else {
        fileStream.write(this.pieces[i].buffer);
        remaining -= this.pieceSize;
      }
    }
    fileStream.end();
    if(remaining !== 0) {
      throw new Error('Incomplete file');
    }
  }
}
