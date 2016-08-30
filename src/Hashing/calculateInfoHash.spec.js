import calculateInfoHash from './calculateInfoHash';
import { readDictionary, readInfo } from './../FileOperations/torrentFile';
import { expect } from 'chai';

describe('calculate InfoHash', () => {
  it('should calculate info hash of image torrent', () => {
    let rawInfo = readInfo('./src/FileOperations/test/image.torrent');
    let hash = calculateInfoHash(rawInfo);
    expect(hash.toString('hex')).to.equal('366472f650a740f24684472255bfb9c0afd7ce63');
  });
  it('should calculate info hash of ubuntu torrent', () => {
    let rawInfo = readInfo('./src/FileOperations/test/ubuntu.torrent');
    let hash = calculateInfoHash(rawInfo);
    expect(hash.toString('hex')).to.equal('9f9165d9a281a9b8e782cd5176bbcc8256fd1871');
  });
  it('should calculate info hash of debian torrent', () => {
    let rawInfo = readInfo('./src/FileOperations/test/debian.torrent');
    let hash = calculateInfoHash(rawInfo);
    expect(hash.toString('hex')).to.equal('620c571308ee3d4b3f3f0811aaef0c45361b29a5');
  });
});