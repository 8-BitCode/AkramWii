/* SoundManager.js
   Tiny singleton sound engine for the Wii-style UI. Two independent
   channels, matching the two sliders already in the Settings panel:

     - SFX    (settings.sfxOn / settings.sfxVolume)   - short one-shot UI
       sounds: clicks, back, start, home-menu, no-disc, page turns.
     - Music  (settings.musicOn / settings.musicVolume) - the looping
       background tracks per screen, plus the Akram "build up" cue.

   Not a React component - plain module so anything (Root, App,
   DiscChannel, GraphicsPage, popups...) can import it and fire a sound
   without needing to be wrapped in a provider or wait for context to
   mount.

   Usage:
     import sound from "./SoundManager";

     // SFX (short, overlapping instances allowed)
     sound.play("select");
     sound.playLoop("loading");     // e.g. transition/loading spinner
     sound.stopLoop("loading");

     // Music (one looping track "active" at a time)
     sound.playMusic("wiiMenu");    // stops whatever music was playing, loops this
     sound.stopMusic();
     sound.playMusicOneShot("buildup"); // ducks the current loop while it plays
     sound.duckMusic(0.15);         // manual duck (0-1 multiplier)
     sound.unduckMusic();

     // Wired up to the Settings panel:
     sound.setSfxEnabled(true);     sound.setSfxVolume(80);
     sound.setMusicEnabled(true);   sound.setMusicVolume(70);

   Drop the files into ./Assets/Sounds/ using these exact names
   (case-sensitive on most hosts):
     SFX (.wav):   Back.wav, Homemenuclose.wav, Homemenuopen.wav,
                   Select.wav, Bootup.wav, loading.wav, Start.wav,
                   Nodisc.wav, Paperturn.wav
     Music (.mp3): Wiimenu.mp3, Aboutme.mp3, Akramexperience.mp3,
                   Graphics.mp3, Buildup.mp3
*/

/* ---------- SFX (short one-shots + the "loading" loop) ---------- */
import back from "./Assets/Sounds/Back.wav";
import homeMenuClose from "./Assets/Sounds/Homemenuclose.wav";
import homeMenuOpen from "./Assets/Sounds/Homemenuopen.wav";
import select from "./Assets/Sounds/Select.wav";
import loading from "./Assets/Sounds/loading.wav";
import start from "./Assets/Sounds/Start.wav";
import noDisc from "./Assets/Sounds/Nodisc.wav";
import paperTurn from "./Assets/Sounds/Paperturn.wav";

const SFX_SRC = {
  back,
  homeMenuClose,
  homeMenuOpen,
  select,
  loading,
  start,
  noDisc,
  paperTurn,
};

/* ---------- Music (looping background tracks + one build-up cue) ---------- */
import wiiMenu from "./Assets/Sounds/Wiimenu.mp3";
import aboutMe from "./Assets/Sounds/Aboutme.mp3";
import akramExperience from "./Assets/Sounds/Akramexperience.mp3";
import graphics from "./Assets/Sounds/Graphics.mp3";
import buildup from "./Assets/Sounds/Buildup.mp3";

const MUSIC_SRC = {
  wiiMenu,
  aboutMe,
  akramExperience,
  graphics,
  buildup,
};

let sfxEnabled = true;
let sfxVolume = 0.8; // 0-1 internally, settings.sfxVolume is 0-100

let musicEnabled = true;
let musicVolume = 0.7; // 0-1 internally, settings.musicVolume is 0-100

/* ---------------------------- SFX channel ---------------------------- */

// One warmed-up <audio> per sound so the browser has already fetched/decoded
// it by the time something needs to play - cloneNode() on play gives us
// cheap overlapping instances (e.g. rapid tile clicks) without re-fetching.
const sfxBaseCache = {};
function getSfxBase(name) {
  if (!SFX_SRC[name]) return null;
  if (!sfxBaseCache[name]) {
    const el = new Audio(SFX_SRC[name]);
    el.preload = "auto";
    sfxBaseCache[name] = el;
  }
  return sfxBaseCache[name];
}

if (typeof window !== "undefined") {
  Object.keys(SFX_SRC).forEach(getSfxBase);
}

/**
 * Fire a one-shot SFX. Safe to call rapidly / concurrently.
 * @param {string} name - key from SFX_SRC
 * @param {{volume?: number}} [opts] - optional 0-1 multiplier on top of sfxVolume
 */
function play(name, opts = {}) {
  if (!sfxEnabled || sfxVolume <= 0) return;
  const base = getSfxBase(name);
  if (!base) return;
  const node = base.cloneNode(true);
  node.volume = Math.max(0, Math.min(1, sfxVolume * (opts.volume ?? 1)));
  // play() rejects if the browser blocks autoplay (e.g. before any user
  // gesture yet) - not an error we need to surface anywhere.
  node.play().catch(() => {});
}

// Looping SFX (currently just "loading") get a single tracked instance
// per name so playLoop()/stopLoop() are idempotent.
const activeSfxLoops = {};

function playLoop(name, opts = {}) {
  if (activeSfxLoops[name]) return; // already looping
  const src = SFX_SRC[name];
  if (!src) return;
  const el = new Audio(src);
  el.loop = true;
  el.volume = sfxEnabled ? Math.max(0, Math.min(1, sfxVolume * (opts.volume ?? 1))) : 0;
  activeSfxLoops[name] = el;
  el.play().catch(() => {});
}

function stopLoop(name) {
  const el = activeSfxLoops[name];
  if (!el) return;
  el.pause();
  el.currentTime = 0;
  delete activeSfxLoops[name];
}

function stopAllLoops() {
  Object.keys(activeSfxLoops).forEach(stopLoop);
}

function setSfxEnabled(enabled) {
  sfxEnabled = !!enabled;
  Object.values(activeSfxLoops).forEach((el) => {
    el.volume = sfxEnabled ? sfxVolume : 0;
  });
}

/** @param {number} volume0to100 - matches settings.sfxVolume's 0-100 scale */
function setSfxVolume(volume0to100) {
  sfxVolume = Math.max(0, Math.min(1, (volume0to100 ?? 0) / 100));
  Object.values(activeSfxLoops).forEach((el) => {
    el.volume = sfxEnabled ? sfxVolume : 0;
  });
}

/* --------------------------- Music channel ---------------------------- */

// Only one background track is ever "the" music - switching screens just
// swaps it out, rather than layering tracks.
let currentMusic = null; // { name, el }
let duckFactor = 1; // temporary multiplier applied on top of musicVolume

function applyCurrentMusicVolume() {
  if (!currentMusic) return;
  currentMusic.el.volume = musicEnabled
    ? Math.max(0, Math.min(1, musicVolume * duckFactor))
    : 0;
}

/**
 * Start looping a background track, replacing whatever music was playing.
 * Calling this again with the same name that's already playing is a no-op
 * (so re-mounting a page component doesn't restart its own track).
 */
function playMusic(name) {
  const src = MUSIC_SRC[name];
  if (!src) return;
  if (currentMusic && currentMusic.name === name) return;

  if (currentMusic) {
    currentMusic.el.pause();
    currentMusic.el.currentTime = 0;
  }

  const el = new Audio(src);
  el.loop = true;
  duckFactor = 1;
  currentMusic = { name, el };
  applyCurrentMusicVolume();
  el.play().catch(() => {});
}

function stopMusic() {
  if (!currentMusic) return;
  currentMusic.el.pause();
  currentMusic.el.currentTime = 0;
  currentMusic = null;
  duckFactor = 1;
}

/** Temporarily lower the currently-playing music's volume (e.g. while a
 * one-shot music cue plays over it) without stopping/restarting it. */
function duckMusic(factor = 0.15) {
  duckFactor = Math.max(0, Math.min(1, factor));
  applyCurrentMusicVolume();
}

function unduckMusic() {
  duckFactor = 1;
  applyCurrentMusicVolume();
}

/** Play a non-looping cue on the music channel/volume (e.g. "Buildup"). */
function playMusicOneShot(name, opts = {}) {
  if (!musicEnabled || musicVolume <= 0) return;
  const src = MUSIC_SRC[name];
  if (!src) return;
  const node = new Audio(src);
  node.volume = Math.max(0, Math.min(1, musicVolume * (opts.volume ?? 1)));
  node.play().catch(() => {});
  return node;
}

function setMusicEnabled(enabled) {
  musicEnabled = !!enabled;
  applyCurrentMusicVolume();
}

/** @param {number} volume0to100 - matches settings.musicVolume's 0-100 scale */
function setMusicVolume(volume0to100) {
  musicVolume = Math.max(0, Math.min(1, (volume0to100 ?? 0) / 100));
  applyCurrentMusicVolume();
}

const sound = {
  // sfx
  play,
  playLoop,
  stopLoop,
  stopAllLoops,
  setSfxEnabled,
  setSfxVolume,
  // music
  playMusic,
  stopMusic,
  duckMusic,
  unduckMusic,
  playMusicOneShot,
  setMusicEnabled,
  setMusicVolume,
};

export default sound;