const crypto = require('crypto');

export default function calculateInfoHash(rawInfo) {
  if (!Buffer.isBuffer(rawInfo)) {
    throw new Error('rawInfo is not buffer.');
  }
  const hash = crypto.createHash('sha1');
  hash.update(rawInfo);
  return hash.digest();
}