// Paper background + crayon grain. Grain is knocked out of the whole drawing
// layer, so lines and fills get the broken "tooth" of crayon on paper.

import { W, H, C } from '../config.js';
import { hash, vnoise2 } from './rng.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function makeGrain(size = 256) {
  const c = canvas(size, size);
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const coarse = vnoise2(5, x / 6, y / 3.2, size / 6 > 0 ? Math.round(size / 6) : 1);
      const mid = vnoise2(9, x / 2.2, y / 2.2, Math.round(size / 2.2));
      const fine = hash(x, y, 13);
      const v = coarse * 0.5 + mid * 0.3 + fine * 0.2;
      const a = v > 0.56 ? Math.min(1, (v - 0.56) / 0.22) : 0;
      const i = (y * size + x) * 4;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function makePaper() {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = C.paper;
  g.fillRect(0, 0, W, H);
  // very faint fibres
  const tile = canvas(256, 256);
  const tg = tile.getContext('2d');
  const img = tg.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const v = vnoise2(21, x / 3, y / 9, 85) * 0.7 + hash(x, y, 4) * 0.3;
      const i = (y * 256 + x) * 4;
      img.data[i] = 120;
      img.data[i + 1] = 105;
      img.data[i + 2] = 90;
      img.data[i + 3] = v > 0.7 ? Math.round((v - 0.7) * 28) : 0;
    }
  }
  tg.putImageData(img, 0, 0);
  g.fillStyle = g.createPattern(tile, 'repeat');
  g.fillRect(0, 0, W, H);
  return c;
}

export class Compositor {
  constructor(target) {
    this.target = target;
    this.tctx = target.getContext('2d');
    this.layer = canvas(W, H);
    this.lctx = this.layer.getContext('2d');
    this.paper = makePaper();
    this.grain = this.lctx.createPattern(makeGrain(), 'repeat');
    this.grainAlpha = 0.5;
  }

  begin() {
    const l = this.lctx;
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.globalAlpha = 1;
    l.clearRect(0, 0, W, H);
    return l;
  }

  end(variant) {
    const l = this.lctx;
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.globalCompositeOperation = 'destination-out';
    l.globalAlpha = this.grainAlpha;
    const off = [0, 97, 181][variant % 3];
    l.translate(off, off * 0.6);
    l.fillStyle = this.grain;
    l.fillRect(-off, -off, W + off * 2, H + off * 2);
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.globalAlpha = 1;
    const t = this.tctx;
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.drawImage(this.paper, 0, 0);
    t.drawImage(this.layer, 0, 0);
  }
}
