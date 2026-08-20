// The service worker has no DOM and cannot play audio, so it hands playback to
// this offscreen document. The tone is generated with Web Audio rather than
// bundled as a file: no binary asset, and the pitch and softness are editable.

const NOTES = [
  { frequency: 880.0, at: 0 }, // A5
  { frequency: 1174.7, at: 0.18 }, // D6
];
const NOTE_LENGTH = 0.5;

function playChime(volume) {
  return new Promise((resolve, reject) => {
    try {
      const ctx = new AudioContext();
      const start = ctx.currentTime + 0.02;
      let last;

      for (const note of NOTES) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = start + note.at;

        osc.type = "sine";
        osc.frequency.value = note.frequency;

        // Fade in briefly and decay away, so it reads as a chime, not a beep.
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + NOTE_LENGTH);

        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + NOTE_LENGTH + 0.05);
        last = osc;
      }

      // Resolve only once the sound has finished, so the service worker does
      // not tear this document down mid-note.
      last.onended = () => ctx.close().then(resolve, resolve);
    } catch (error) {
      reject(error);
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== "offscreen" || message.type !== "playChime") {
    return;
  }
  playChime(message.volume).then(
    () => sendResponse({ ok: true }),
    (error) => sendResponse({ ok: false, error: String(error) })
  );
  return true; // keep the message channel open for the async reply
});
