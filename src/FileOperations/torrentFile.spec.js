import { read as readTorrentFile } from './torrentFile';
import { readString, readInteger, readKeyValuePair } from './torrentFile';
import { expect } from 'chai';

describe('TorrentFile', () => {
  describe('read operation', () => {
    it('should read torrent file', () => {
      readTorrentFile('./src/FileOperations/test/ubuntu.torrent');
    });
  });
  describe('read string operation', () => {
    it('should read raw string buffer', () => {
      let testString = '8:announce';
      let expected = 'announce';

      let stringBuffer = Buffer.from(testString, 'ascii');
      let result = readString(stringBuffer, 0);

      expect(result).to.equal(expected);
    });
  });
  describe('read integer operation', () => {
    it('should read raw integer buffer', () => {
      let testString = 'i59616e';
      let expected = 59616;

      let stringBuffer = Buffer.from(testString, 'ascii');
      let result = readInteger(stringBuffer, 0);

      expect(result).to.equal(expected);
    });
  });
  describe('read key value pair operation', () => {
    it('should read raw key value pair buffer', () => {
      let testString = '7:comment17:Comment goes here';
      let key = 'comment';
      let value = 'Comment goes here';

      let stringBuffer = Buffer.from(testString, 'ascii');
      let result = readKeyValuePair(stringBuffer, 0);

      expect(result[0]).to.equal(key);
      expect(result[1]).to.equal(value);
    });
  });
});