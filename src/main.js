import Torrent from './torrent';
import TorrentConnection from './torrentConnection';

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('warning', (warning) => {
  console.warn(warning.message);
  console.warn(warning.stack);
});

const configuration = {
  tmpDir: 'C:\\Users\\Alican\\Desktop\\TMP'
}
const torrentPath = './src/FileOperations/test/hp.torrent';
const torrent = new Torrent(torrentPath);
const torrentConnection = new TorrentConnection(torrent, configuration);

torrentConnection.start();
