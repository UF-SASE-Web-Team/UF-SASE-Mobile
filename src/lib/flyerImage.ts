import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Mirrors the public-assets bucket limit (see limit_public_assets_uploads). */
export const MAX_FLYER_BYTES = 500 * 1024;

// Tried in order until the flyer fits under the limit.
const ATTEMPTS = [
  { width: 1080, compress: 0.8 },
  { width: 1080, compress: 0.6 },
  { width: 900, compress: 0.5 },
  { width: 720, compress: 0.45 },
  { width: 600, compress: 0.35 },
];

/** Decoded size of a base64 string, without decoding it. */
export function base64ByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Converts a picked photo to a WebP under 500 KB, the only format the
 * public-assets bucket accepts, shrinking it until it fits.
 */
export async function prepareFlyer(uri: string, originalWidth: number): Promise<ArrayBuffer> {
  for (const attempt of ATTEMPTS) {
    const context = ImageManipulator.manipulate(uri);
    if (originalWidth > attempt.width) context.resize({ width: attempt.width });
    const image = await context.renderAsync();
    const result = await image.saveAsync({
      format: SaveFormat.WEBP,
      compress: attempt.compress,
      base64: true,
    });
    if (result.base64 && base64ByteLength(result.base64) <= MAX_FLYER_BYTES) {
      return base64ToArrayBuffer(result.base64);
    }
  }
  throw new Error('This image is too large to use as a flyer. Try a smaller image.');
}
