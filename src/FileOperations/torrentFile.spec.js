import { read as readTorrentFile } from './torrentFile';

describe('TorrentFile', () => {
  describe('read operation', () => {
    it('should read torrent file', () => {
      readTorrentFile('./src/FileOperations/test/ubuntu.torrent');
    });
  });
});