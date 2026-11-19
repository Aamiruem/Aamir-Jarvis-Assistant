// Camera Lab frame processing: stats and the three visual effects, on tiny synthetic frames.
import { describe, expect, it } from 'vitest';
import { processFrame } from './CameraLab.jsx';

const frame = (w, h, fill) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...fill(i % w, Math.floor(i / w)), 255], i * 4);
  return { data, width: w, height: h };
};

describe('processFrame', () => {
  it('measures brightness, average colour and the histogram', () => {
    const s = processFrame(frame(4, 4, () => [255, 0, 0]), null, 'normal');
    expect(s.avg).toEqual([255, 0, 0]);
    expect(s.brightness).toBe(76); // luminance of pure red
    expect(s.hist[0][31]).toBe(16); // every pixel in the brightest red bucket
    expect(s.motion).toBe(0); // no previous frame yet
  });

  it('detects motion as the share of changed pixels', () => {
    const dark = processFrame(frame(10, 10, () => [0, 0, 0]), null, 'normal');
    const half = processFrame(frame(10, 10, (x) => (x < 5 ? [255, 255, 255] : [0, 0, 0])), dark.gray, 'motion');
    expect(half.motion).toBe(50);
  });

  it('edges light up a boundary and stay dark on flat areas', () => {
    const img = frame(8, 8, (x) => (x < 4 ? [0, 0, 0] : [255, 255, 255]));
    processFrame(img, null, 'edges');
    const px = (x, y) => img.data[(y * 8 + x) * 4 + 2];
    expect(px(4, 4)).toBeGreaterThan(200); // on the boundary
    expect(px(1, 4)).toBe(0); // flat black area
  });

  it('heat map turns dark pixels blue and bright pixels warm', () => {
    const img = frame(2, 1, (x) => (x === 0 ? [0, 0, 0] : [255, 255, 255]));
    processFrame(img, null, 'heat');
    const [r0, , b0] = img.data.slice(0, 3);
    const [r1, , b1] = img.data.slice(4, 7);
    expect(b0).toBeGreaterThan(r0);
    expect(r1).toBeGreaterThan(b1);
  });
});
