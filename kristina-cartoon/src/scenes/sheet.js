// Character model sheet (dev only: index.html?dev&test=1). Not part of the film.
import { drawKristina, drawKristinaProfile } from '../characters/kristina.js';
import { drawClient } from '../characters/client.js';
import { drawPhone } from '../props/items.js';

export const SHEET = {
  name: 'Model sheet',
  len: 6,
  draw(f) {
    const exprK = ['serious', 'squint', 'blink', 'twitch', 'happy', 'serious'][f];
    const exprC = ['calm', 'hopeful', 'ooh', 'stars', 'joy', 'look'][f];
    const cross = [[{ t: [70, -455], bend: -1 }, { t: [-70, -445], bend: 1 }], [{ t: [60, -450], bend: 1 }, { t: [-60, -440], bend: -1 }], [{ t: [40, -470], bend: -1 }, { t: [-40, -480], bend: 1 }]][f % 3];
    drawKristina({ x: 270, y: 900, s: 0.78, expr: exprK, armL: cross[0], armR: cross[1] });
    drawClient({ x: 790, y: 900, s: 0.78, expr: exprC, tattoo: 1, armL: { t: [-20, -610], bend: 1 } });
    drawKristina({ x: 270, y: 1780, s: 0.7, outfit: 'work', gloves: true, expr: exprK, armsOver: f === 4, armL: f === 4 ? { t: [-200, -900] } : undefined, armR: f === 4 ? { t: [200, -900] } : { t: [150, -640], bend: 1 } });
    drawKristinaProfile({ x: 600, y: 1780, s: 0.75, mach: 1.0, handR: [250, -420], handL: [290, -360] });
    drawPhone('ph', 930, 1450, 0.8);
  },
};
