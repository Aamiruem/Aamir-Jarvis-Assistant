import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

// Room Watch: notices when someone walks into the room, using the webcam.
//
// Cheap and private first: motion is measured right here in the browser on a tiny 64x48 grey
// copy of each frame (no image leaves the PC for that). Only when there's motion after the room
// has been empty is one frame sent to the AI service, which looks for a face with OpenCV on this
// PC (use_llm=false: no image goes to Claude). Motion + a face = someone arrived.

const SAMPLE_MS = 500; // how often the camera is checked for motion
const W = 64;
const H = 48;
const PIXEL_CHANGE = 28; // a pixel "moved" when its brightness changes this much (camera noise is ~5)
const MOTION_SHARE = 0.05; // ...and motion = at least 5% of pixels moved
export const EMPTY_AFTER_MS = 3 * 60_000; // this long with no motion and no face = the room is empty
const GREET_COOLDOWN_MS = 10 * 60_000; // never greet more than once per 10 minutes
const FACE_TRIES = 4; // a person walking in may not face the camera at once

/** Share of pixels whose brightness changed by more than PIXEL_CHANGE between two grey frames. */
export function motionShare(prev, next) {
  let moved = 0;
  for (let i = 0; i < next.length; i++) if (Math.abs(next[i] - prev[i]) > PIXEL_CHANGE) moved++;
  return moved / next.length;
}

function greyFrame(video, ctx) {
  ctx.drawImage(video, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);
  const grey = new Uint8Array(W * H);
  for (let i = 0; i < grey.length; i++) grey[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8;
  return grey;
}

function snapshot(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

async function hasFace(video) {
  const blob = await snapshot(video);
  if (!blob) return false;
  const result = await api.analyzeImage(blob, '', { useLlm: false });
  return result.faces.length > 0;
}

/**
 * enabled   - turn the camera on/off
 * onArrival - called once when someone enters a room that was empty
 * Returns { status: 'off' | 'starting' | 'watching' | 'present' | 'error', error }
 */
export function useRoomWatch({ enabled, onArrival }) {
  const [status, setStatus] = useState('off');
  const [error, setError] = useState('');
  const arrival = useRef(onArrival);
  arrival.current = onArrival;

  useEffect(() => {
    if (!enabled) {
      setStatus('off');
      return;
    }
    let stopped = false;
    let stream;
    let timer;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    ctx.canvas.width = W;
    ctx.canvas.height = H;

    let prev = null;
    let present = false; // someone is in the room (as far as we know)
    let lastMotion = 0;
    let lastGreeting = 0;
    let checking = false;

    const check = async () => {
      // Someone moved in an empty room: is it a person? Try a few frames.
      checking = true;
      try {
        for (let i = 0; i < FACE_TRIES && !stopped; i++) {
          if (await hasFace(video)) {
            present = true;
            setStatus('present');
            if (Date.now() - lastGreeting > GREET_COOLDOWN_MS) {
              lastGreeting = Date.now();
              arrival.current?.();
            }
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (e) {
        setError(`Room Watch couldn't check the camera image: ${e.message}`);
      } finally {
        checking = false;
      }
    };

    const confirmEmpty = async () => {
      // Long stillness: maybe they left, maybe they're just sitting still at the desk.
      checking = true;
      try {
        if (await hasFace(video)) lastMotion = Date.now(); // still here
        else {
          present = false;
          setStatus('watching');
        }
      } catch {
        lastMotion = Date.now(); // can't tell: assume still here rather than greet again
      } finally {
        checking = false;
      }
    };

    const tick = () => {
      if (stopped || video.readyState < 2) return;
      const grey = greyFrame(video, ctx);
      const moving = prev && motionShare(prev, grey) > MOTION_SHARE;
      prev = grey;
      if (moving) lastMotion = Date.now();
      if (checking) return;
      if (!present && moving) check();
      else if (present && Date.now() - lastMotion > EMPTY_AFTER_MS) confirmEmpty();
    };

    setStatus('starting');
    setError('');
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 10 } }, audio: false })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        video.srcObject = s;
        await video.play();
        setStatus('watching');
        timer = setInterval(tick, SAMPLE_MS);
      })
      .catch((e) => {
        setStatus('error');
        setError(e.name === 'NotAllowedError' ? 'Camera access is blocked. Allow it from the lock icon in the address bar.' : `Camera unavailable: ${e.message}`);
      });

    return () => {
      stopped = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled]);

  return { status, error };
}
