import { ImageManipulator } from 'expo-image-manipulator';
import { base64ByteLength, MAX_FLYER_BYTES, prepareFlyer } from '@/lib/flyerImage';

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { WEBP: 'webp' },
  ImageManipulator: { manipulate: jest.fn() },
}));

/** A base64 string that decodes to `bytes` bytes. */
const base64Of = (bytes: number) => 'A'.repeat(Math.ceil((bytes * 4) / 3 / 4) * 4);

function mockAttempts(sizes: number[]) {
  const resize = jest.fn();
  const saveAsync = jest.fn();
  sizes.forEach((size) => saveAsync.mockResolvedValueOnce({ base64: base64Of(size) }));
  (ImageManipulator.manipulate as jest.Mock).mockImplementation(() => ({
    resize,
    renderAsync: jest.fn().mockResolvedValue({ saveAsync }),
  }));
  return { resize, saveAsync };
}

describe('prepareFlyer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('measures base64 without decoding it', () => {
    expect(base64ByteLength('QUJD')).toBe(3);
    expect(base64ByteLength('QUI=')).toBe(2);
  });

  it('shrinks the image until it fits the bucket limit', async () => {
    const { saveAsync, resize } = mockAttempts([900_000, 700_000, 400_000]);
    const buffer = await prepareFlyer('file://flyer.jpg', 3000);
    expect(saveAsync).toHaveBeenCalledTimes(3);
    expect(saveAsync).toHaveBeenCalledWith(expect.objectContaining({ format: 'webp' }));
    expect(resize).toHaveBeenCalledWith({ width: 1080 });
    expect(buffer.byteLength).toBeLessThanOrEqual(MAX_FLYER_BYTES);
  });

  it('does not upscale small images', async () => {
    const { resize } = mockAttempts([100_000]);
    await prepareFlyer('file://small.png', 600);
    expect(resize).not.toHaveBeenCalled();
  });

  it('gives up with a clear message when nothing fits', async () => {
    mockAttempts([900_000, 900_000, 900_000, 900_000, 900_000]);
    await expect(prepareFlyer('file://huge.png', 4000)).rejects.toThrow(/too large/);
  });
});
