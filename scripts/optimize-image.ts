/// <reference types="node" />

/**
 * Converts an image to a small WebP that fits the `public-assets` bucket limits
 * (WebP only, 500 KB max). Use it before uploading event flyers, program
 * banners or resource icons.
 *
 *   npm run optimize-image -- flyer.png
 *   npm run optimize-image -- flyer.png --width 800 --out flyers/gbm-2.webp
 *
 * Requires the `cwebp` tool: `brew install webp`.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const MAX_UPLOAD_BYTES = 512_000;
export const DEFAULT_WIDTH = 1080;
export const DEFAULT_QUALITY = 80;
export const MIN_QUALITY = 50;
const QUALITY_STEP = 10;

export interface OptimizeOptions {
  input: string;
  output: string;
  width: number;
  quality: number;
}

export function parseCliArgs(argv: string[]): OptimizeOptions {
  let input: string | undefined;
  let output: string | undefined;
  let width = DEFAULT_WIDTH;
  let quality = DEFAULT_QUALITY;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--width' || arg === '-w') {
      width = parsePositiveInt(argv[++i], '--width');
    } else if (arg === '--quality' || arg === '-q') {
      quality = parsePositiveInt(argv[++i], '--quality');
      if (quality > 100) throw new Error('--quality must be between 1 and 100.');
    } else if (arg === '--out' || arg === '-o') {
      output = argv[++i];
      if (!output) throw new Error('--out needs a file path.');
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!input) {
      input = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (!input)
    throw new Error('Usage: npm run optimize-image -- <image> [--width 1080] [--out x.webp]');

  return { input, output: output ?? defaultOutputPath(input), width, quality };
}

/** `flyers/GBM 2.png` -> `flyers/GBM 2.webp` (or `.min.webp` if the input is already WebP). */
export function defaultOutputPath(input: string): string {
  const { dir, name, ext } = path.parse(input);
  const suffix = ext.toLowerCase() === '.webp' ? '.min.webp' : '.webp';
  return path.join(dir, `${name}${suffix}`);
}

/** Qualities to try, highest first, until the file fits under the limit. */
export function qualitySteps(start: number): number[] {
  const steps: number[] = [];
  for (let q = start; q >= MIN_QUALITY; q -= QUALITY_STEP) steps.push(q);
  if (steps.length === 0) steps.push(start);
  return steps;
}

function parsePositiveInt(value: string | undefined, flag: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${flag} must be a positive whole number.`);
  return n;
}

function encode(options: OptimizeOptions, quality: number) {
  execFileSync(
    'cwebp',
    [
      '-quiet',
      '-q',
      String(quality),
      '-alpha_q',
      '100',
      '-resize',
      String(options.width),
      '0',
      '-resize_mode',
      'down_only',
      '-metadata',
      'none',
      options.input,
      '-o',
      options.output,
    ],
    { stdio: 'inherit' },
  );
  return fs.statSync(options.output).size;
}

export function optimizeImage(options: OptimizeOptions): { bytes: number; quality: number } {
  if (!fs.existsSync(options.input)) throw new Error(`File not found: ${options.input}`);

  let bytes = Infinity;
  let quality = options.quality;
  for (quality of qualitySteps(options.quality)) {
    bytes = encode(options, quality);
    if (bytes <= MAX_UPLOAD_BYTES) break;
  }
  return { bytes, quality };
}

export function runCli(argv: string[] = process.argv.slice(2)) {
  const options = parseCliArgs(argv);
  if (!fs.existsSync(options.input)) throw new Error(`File not found: ${options.input}`);

  try {
    execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
  } catch {
    throw new Error('cwebp is not installed. Run `brew install webp` and try again.');
  }

  const before = fs.statSync(options.input).size;
  const { bytes, quality } = optimizeImage(options);
  const kb = (n: number) => `${Math.round(n / 1024)} KB`;

  console.log(`${options.output}: ${kb(before)} -> ${kb(bytes)} (quality ${quality})`);
  if (bytes > MAX_UPLOAD_BYTES) {
    console.error(
      `Still over the ${kb(MAX_UPLOAD_BYTES)} upload limit. Try a smaller --width (e.g. 800).`,
    );
    process.exitCode = 1;
  }
}

const isMain = Boolean(process.argv[1] && process.argv[1].includes('optimize-image'));

if (isMain) {
  try {
    runCli();
  } catch (err: any) {
    console.error(err?.message ?? err);
    process.exit(1);
  }
}
