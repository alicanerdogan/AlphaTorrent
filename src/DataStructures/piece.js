export default class Piece {
  constructor(size, hash) {
    this.buffer = Buffer.alloc(size);
    this.hash = Buffer.from(hash);
  }

  update(startIndex, data) {
    this.buffer.fill(data, startIndex);
  }
}
