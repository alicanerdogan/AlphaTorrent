import {
  read as readTorrentFile
} from './torrentFile';
import {
  readString,
  readInteger,
  readKeyValuePair,
  readList,
  readDictionary,
  readInfo
} from './torrentFile';
import {
  expect
} from 'chai';

describe('TorrentFile', () => {
  describe('read string operation', () => {
    it('should read raw string buffer', () => {
      let testString = '8:announce';
      let expected = 'announce';

      let stringBuffer = Buffer.from(testString, 'utf8');
      let result = readString(stringBuffer, 0).toString();

      expect(result).to.equal(expected);
    });
    it('should read SHA1 hash', () => {
      let testString = '40:AAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDD';
      let expected = Buffer.from('AAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDD', 'utf8');

      let stringBuffer = Buffer.from(testString, 'utf8');
      let result = readString(stringBuffer, 0);

      expect(result.equals(expected)).to.be.true;
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
  describe('read list operation', () => {
    it('should read raw list buffer', () => {
      let testString = 'l5:ItemA5:ItemBe';
      let firstItem = 'ItemA';
      let secondItem = 'ItemB';

      let stringBuffer = Buffer.from(testString, 'ascii');
      let result = readList(stringBuffer, 0);

      expect(result[0]).to.equal(firstItem);
      expect(result[1]).to.equal(secondItem);
    });
  });
  describe('read dictionary operation', () => {
    it('should read raw dictionary buffer', () => {
      let testString = 'd8:announce33:http://192.168.1.74:6969/announce7:comment17:Comment goes here10:created by25:Transmission/2.92 (14714)13:creation datei1460444420e8:encoding5:UTF-84:infod6:lengthi59616e4:name9:lorem.txt12:piece lengthi32768e6:pieces40:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7:privatei0eee';

      let stringBuffer = Buffer.from(testString, 'utf8');
      let result = readDictionary(stringBuffer, 0);

      expect(result['comment']).to.equal('Comment goes here');
    });
  });
  describe('read operation', () => {
    it('should read image torrent file', () => {
      let torrent = readTorrentFile('./src/FileOperations/test/image.torrent');
    });
    it('should read ubuntu torrent file', () => {
      let torrent = readTorrentFile('./src/FileOperations/test/debian.torrent');
    });
  });
  describe('read raw info function', () => {
    it('should read raw info of image torrent file', () => {
      let rawInfo = readInfo('./src/FileOperations/test/image.torrent');
      let info = readDictionary(rawInfo, 0);
      expect(info.length).to.equal(12014);
    });
  });
});