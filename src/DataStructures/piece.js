const crypto = require('crypto');

export default class Piece {
  constructor(index, size, hash) {
    this.index = index;
    this.size = size;
    this.buffer = Buffer.alloc(size);
    this.hash = Buffer.from(hash);
  }

  update(startIndex, data) {
    this.buffer.fill(data, startIndex);
  }

  isIntact() {
    const hash = crypto.createHash('sha1');
    hash.update(this.buffer);
    return this.hash.equals(hash.digest());
  }
}
