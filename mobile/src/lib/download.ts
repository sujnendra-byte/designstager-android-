// Download a file into the app, then open the system Share sheet
// (Save image / Save to Files / open in PowerPoint, etc.).
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function safeName(name: string, url: string) {
  const ext = (url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i) || [])[1] || 'bin';
  const base = (name || 'designstager').replace(/[^a-z0-9 _-]+/gi, '').trim().slice(0, 60) || 'designstager';
  return `${base}.${ext.toLowerCase()}`;
}

export async function downloadAndShare(url: string, name: string, onProgress?: (p: number) => void) {
  const target = new File(Paths.cache, safeName(name, url));
  const file = await File.downloadFileAsync(url, target, {
    idempotent: true,
    onProgress: onProgress
      ? (d: any) => {
          const total = d.totalBytesExpectedToWrite || d.totalBytes || 0;
          const done = d.totalBytesWritten || d.bytesWritten || 0;
          if (total) onProgress(done / total);
        }
      : undefined,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { dialogTitle: name });
  }
  return file.uri;
}

/** Save a file the web page created (base64) and open the Share sheet. */
export async function saveBase64AndShare(base64: string, name: string, mime?: string) {
  const clean = (name || 'designstager').replace(/[\\/:*?"<>|]+/g, '').slice(0, 80) || 'designstager';
  const file = new File(Paths.cache, clean);
  await file.write(base64, { encoding: 'base64' });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { dialogTitle: clean, mimeType: mime });
  }
  return file.uri;
}
