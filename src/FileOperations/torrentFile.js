import Torrent from '../DataStructures/torrent';
import fs from 'fs';

export function read(torrentPath) {
  let fileBuffer = fs.readFileSync(torrentPath);
}