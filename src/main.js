import Torrent from './torrent';
import TorrentConnection from './torrentConnection';

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('warning', (warning) => {
  console.warn(warning.message);
  console.warn(warning.stack);
});

const torrentPath = './src/FileOperations/test/hp.torrent';
const torrent = new Torrent(torrentPath);
const torrentConnection = new TorrentConnection(torrent);

torrentConnection.on('downloaded', () => {
  const files = torrent.torrentInfo.info.files;
  let startIndex = 0;
  if (files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      torrentConnection.pieces.writeToFile(file.path[0], startIndex, file.length);
      console.log('written to ' + file.path[0]);
      startIndex += file.length;
    }
  } else {
    torrentConnection.pieces.writeToFile(torrent.torrentInfo.info.name, startIndex, torrent.size);
    console.log('written to ' + torrent.torrentInfo.info.name);
  }
});

torrentConnection.start();
