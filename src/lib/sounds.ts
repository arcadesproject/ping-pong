// disabled just for zzfx
/* eslint-disable no-sparse-arrays */
import { zzfx } from 'zzfx';

export const Sounds = {
  paddle: () => zzfx(...[, , 800, .05, .02, .08, 1, 1.5, -5, .1]),
  score: () => zzfx(...[, , 523, .1, .05, .3, 1, 1.8]),
  start: () => zzfx(...[, , 100,,.1,.2,4,.2,-50,,,,,5,.2,.2]),
  gameOver: () => zzfx(...[, , 300,.2,.1,.2,,1.5,-50,,,,,10,.6,.1])
};

// Audio context starter (required for mobile)
export const initAudio = async () => {
  try {
    const silent = new Audio();
    silent.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...';
    await silent.play();
  } catch (error) {
    console.warn('Audio initialization failed:', error);
    // Handle the error appropriately
  }
};