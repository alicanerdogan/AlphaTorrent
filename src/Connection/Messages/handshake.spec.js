import { decodeHandshake, encodeHandshake } from './handshake';
import { expect } from 'chai';

describe('Handshake Message', () => {
  it('should encode and decode message', () => {
    const infohash = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 14, 15, 16, 17, 18, 19]);
    const id = "-TR2920-vn40dxznw5d4";
    const message = encodeHandshake(infohash, id);
    const decodedMessage = decodeHandshake(message);

    expect(decodedMessage.id).to.equal(id);
    expect(decodedMessage.protocol).to.equal('BitTorrent protocol');
    expect(decodedMessage.infohash.equals(infohash)).to.be.ok;
  });
});