// Global constants for the film.
export const W = 1080;
export const H = 1920;
export const FPS = 12; // animation drawings per second (never interpolated)

// Instagram Reels UI zones (pixels in the 1080x1920 frame).
export const SAFE = {
  top: 250, // progress bar / header
  bottom: 1500, // caption, audio, buttons
  rightX: 950, // like / comment / share column ...
  rightTop: 1000, // ... from this y downwards
  left: 60,
};

// Crayon palette.
export const C = {
  paper: '#fffdf9',
  ink: '#231f20',
  white: '#ffffff',
  skin: '#f9d7b9',
  skinShade: '#f0bf9a',
  blush: '#f59aa8',
  mouth: '#9c3443',
  tongue: '#f3808f',

  kHair: '#f7b4cc',
  kHairHatch: '#ee8fb4',
  lips: '#c9737f',
  glove: '#f8a9c9',
  gloveHatch: '#ef84b2',
  glassTint: '#9fb3c4',
  pearl: '#ffffff',
  black: '#3b3637',
  sleeve: '#4a4345',
  blackHatch: '#1f1b1c',

  cHair: '#cf9a5f',
  cHairDark: '#a26a39',
  lilac: '#c9a8f2',
  lilacDark: '#a983e0',
  jeans: '#a5cbf2',
  jeansDark: '#79a8dc',
  sneaker: '#f4f1ee',

  pink: '#f47aa8',
  flower: '#ef5466',
  flowerHatch: '#d93a4f',
  pinkLight: '#f9b6cf',
  red: '#ec5656',
  green: '#5cae55',
  greenDark: '#3f8d3d',
  yellow: '#f8cf47',
  orange: '#f2a24b',
  wood: '#dba66c',
  grey: '#b9b6b2',
  greyDark: '#86827e',
  greyLight: '#dedbd7',
  glass: '#d4eaf9',
  blue: '#7fb2ea',
  lamp: '#fff3b0',
};
