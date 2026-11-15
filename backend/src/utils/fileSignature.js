import fs from 'fs/promises';

/**
 * Detect the real MIME type of a file from its leading bytes (magic numbers).
 * Only recognises the types this app accepts; returns null for anything else.
 * @param {Buffer} buf - At least the first 16 bytes of the file
 * @returns {string|null}
 */
export function detectMimeType(buf) {
  if (!buf || buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }

  // ISO base media (MP4 / MOV): "ftyp" at offset 4, major brand at offset 8
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    return brand === 'qt  ' ? 'video/quicktime' : 'video/mp4';
  }

  // Older QuickTime files may start with other atoms (moov / mdat / wide / free)
  const atom = buf.toString('ascii', 4, 8);
  if (['moov', 'mdat', 'wide', 'free', 'skip'].includes(atom)) return 'video/quicktime';

  // WebM / Matroska: EBML header 1A 45 DF A3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm';

  return null;
}

/**
 * Read the first bytes of a file on disk and detect its MIME type.
 * @param {string} filePath
 */
export async function detectFileMimeType(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buf, 0, 16, 0);
    return detectMimeType(buf.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

export default { detectMimeType, detectFileMimeType };
