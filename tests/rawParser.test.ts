import { describe, it, expect } from 'vitest';
import sharp from 'sharp';

function extractEmbeddedJpegFromRaw(bytes: Uint8Array): Uint8Array | null {
  let largestJpegStart = -1;
  let largestJpegEnd = -1;
  let maxLen = 0;

  let i = 0;
  while (i < bytes.length - 4) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
      const start = i;
      let j = start + 3;
      let end = -1;
      while (j < bytes.length - 1) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          end = j + 2;
          break;
        }
        j++;
      }

      if (end !== -1) {
        const len = end - start;
        if (len > maxLen && len > 100) {
          maxLen = len;
          largestJpegStart = start;
          largestJpegEnd = end;
        }
        i = end;
        continue;
      }
    }
    i++;
  }

  if (largestJpegStart !== -1 && largestJpegEnd !== -1) {
    return bytes.subarray(largestJpegStart, largestJpegEnd);
  }
  return null;
}

describe('RAW & Rare Image formats', () => {
  it('Sharp should decode TIFF and generate WebP/JPEG', async () => {
    const tiffBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).tiff().toBuffer();

    const metadata = await sharp(tiffBuffer).metadata();
    expect(metadata.format).toBe('tiff');
    expect(metadata.width).toBe(100);

    const converted = await sharp(tiffBuffer).webp().toBuffer();
    const metaConverted = await sharp(converted).metadata();
    expect(metaConverted.format).toBe('webp');
  });

  it('Embedded JPEG extractor should locate and extract JPEG stream from synthetic container', async () => {
    const jpegBuffer = await sharp({
      create: {
        width: 200,
        height: 150,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      }
    }).jpeg().toBuffer();

    // Create a container with dummy header + JPEG buffer + dummy trailer
    const prefix = Buffer.from('RAW_DNG_HEADER_DATA_PADDING_BYTE_STREAM');
    const suffix = Buffer.from('RAW_DNG_TRAILER_METADATA_PADDING');
    const fullContainer = Buffer.concat([prefix, jpegBuffer, suffix]);

    const extracted = extractEmbeddedJpegFromRaw(new Uint8Array(fullContainer));
    expect(extracted).not.toBeNull();
    
    const extractedMetadata = await sharp(Buffer.from(extracted!)).metadata();
    expect(extractedMetadata.format).toBe('jpeg');
    expect(extractedMetadata.width).toBe(200);
    expect(extractedMetadata.height).toBe(150);
  });
});
