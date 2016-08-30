import urlEncodeBuffer from './urlEncodeBuffer';
import calculateInfoHash from './calculateInfoHash';
import { readDictionary, readInfo } from './../FileOperations/torrentFile';
import { expect } from 'chai';

describe('url encode buffer', () => {
  it('should url encode info hash of image torrent', () => {
    let rawInfo = readInfo('./src/FileOperations/test/image.torrent');
    let encodedInfoHash = urlEncodeBuffer(calculateInfoHash(rawInfo));
    expect(encodedInfoHash).to.equal('6dr%f6P%a7@%f2F%84G%22U%bf%b9%c0%af%d7%cec');
  });
  it('should url encode info hash of ubuntu torrent', () => {
    let rawInfo = readInfo('./src/FileOperations/test/ubuntu.torrent');
    let encodedInfoHash = urlEncodeBuffer(calculateInfoHash(rawInfo));
    expect(encodedInfoHash).to.equal('%9f%91e%d9%a2%81%a9%b8%e7%82%cdQv%bb%cc%82V%fd%18q');
  });
  it('should url encode info hash of debian torrent', () => {
    let rawInfo = readInfo('./src/FileOperations/test/debian.torrent');
    let encodedInfoHash = urlEncodeBuffer(calculateInfoHash(rawInfo));
    expect(encodedInfoHash).to.equal('b%0cW%13%08%ee=K??%08%11%aa%ef%0cE6%1b)%a5');
  });
});