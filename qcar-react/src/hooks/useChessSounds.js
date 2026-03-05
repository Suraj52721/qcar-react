// ============================================================
// useChessSounds.js — Web Audio API-based chess sounds
// No asset files needed — synthesised on the fly
// ============================================================
import { useCallback, useRef } from 'react';

function createContext() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        return Ctx ? new Ctx() : null;
    } catch {
        return null;
    }
}

// Play a short tone burst
function playTone(ctx, { freq = 440, type = 'sine', gain = 0.3, attack = 0.005, decay = 0.1, release = 0.1 }) {
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gain, now + attack);
    env.gain.exponentialRampToValueAtTime(0.001, now + attack + decay + release);

    osc.connect(env);
    env.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + attack + decay + release + 0.05);
}

// Play a "woody" click (filtered noise burst) — used for moves
function playClick(ctx, pitch = 1.0, gainScale = 1.0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufLen = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200 * pitch;
    filter.Q.value = 0.8;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.5 * gainScale, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    src.connect(filter);
    filter.connect(env);
    env.connect(ctx.destination);
    src.start(now);
}

const SOUNDS = {
    // Regular piece move — mid woody click
    move: (ctx) => {
        playClick(ctx, 1.0, 0.7);
    },

    // Capture — sharper, slightly higher
    capture: (ctx) => {
        playClick(ctx, 1.5, 1.0);
        // Small pitch-up accent
        setTimeout(() => playTone(ctx, { freq: 320, type: 'triangle', gain: 0.12, attack: 0.01, decay: 0.06, release: 0.04 }), 30);
    },

    // Check — two-note warning ding
    check: (ctx) => {
        playTone(ctx, { freq: 660, type: 'sine', gain: 0.25, attack: 0.01, decay: 0.12, release: 0.1 });
        setTimeout(() => playTone(ctx, { freq: 880, type: 'sine', gain: 0.2, attack: 0.01, decay: 0.12, release: 0.1 }), 130);
    },

    // Game start — rising arpeggio
    gameStart: (ctx) => {
        [261, 329, 392, 523].forEach((freq, i) => {
            setTimeout(() => playTone(ctx, { freq, type: 'sine', gain: 0.18, attack: 0.01, decay: 0.15, release: 0.1 }), i * 100);
        });
    },

    // Game end — descending resolution chord
    gameEnd: (ctx) => {
        [523, 415, 349, 262].forEach((freq, i) => {
            setTimeout(() => playTone(ctx, { freq, type: 'sine', gain: 0.15, attack: 0.02, decay: 0.25, release: 0.2 }), i * 140);
        });
    },
};

export function useChessSounds(enabled = true) {
    const ctxRef = useRef(null);

    // Lazily create AudioContext on first use (requires user gesture in most browsers)
    const getCtx = useCallback(() => {
        if (!enabled) return null;
        if (!ctxRef.current) ctxRef.current = createContext();
        if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
        return ctxRef.current;
    }, [enabled]);

    const playSound = useCallback((type) => {
        if (!enabled) return;
        const fn = SOUNDS[type];
        if (!fn) return;
        try {
            fn(getCtx());
        } catch (err) {
            console.warn('[Chess sounds] playback error:', err);
        }
    }, [enabled, getCtx]);

    return { playSound };
}
