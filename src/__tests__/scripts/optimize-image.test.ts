import {
  DEFAULT_QUALITY,
  DEFAULT_WIDTH,
  MIN_QUALITY,
  defaultOutputPath,
  parseCliArgs,
  qualitySteps,
} from '../../../scripts/optimize-image.ts';

describe('optimize-image script', () => {
  describe('parseCliArgs', () => {
    it('uses defaults and writes a .webp next to the input', () => {
      expect(parseCliArgs(['flyers/gbm.png'])).toEqual({
        input: 'flyers/gbm.png',
        output: 'flyers/gbm.webp',
        width: DEFAULT_WIDTH,
        quality: DEFAULT_QUALITY,
      });
    });

    it('accepts width, quality and output overrides', () => {
      expect(parseCliArgs(['in.jpg', '--width', '800', '-q', '70', '--out', 'out.webp'])).toEqual({
        input: 'in.jpg',
        output: 'out.webp',
        width: 800,
        quality: 70,
      });
    });

    it('rejects missing input, bad numbers and unknown flags', () => {
      expect(() => parseCliArgs([])).toThrow(/Usage/);
      expect(() => parseCliArgs(['a.png', '--width', '0'])).toThrow(/--width/);
      expect(() => parseCliArgs(['a.png', '--quality', '101'])).toThrow(/--quality/);
      expect(() => parseCliArgs(['a.png', '--nope'])).toThrow(/Unknown option/);
    });
  });

  it('does not overwrite a WebP input', () => {
    expect(defaultOutputPath('icons/logo.webp')).toBe('icons/logo.min.webp');
  });

  it('steps quality down to the minimum until the file fits', () => {
    expect(qualitySteps(80)).toEqual([80, 70, 60, 50]);
    expect(qualitySteps(MIN_QUALITY - 10)).toEqual([MIN_QUALITY - 10]);
  });
});
