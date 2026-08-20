const ALARM_NAME = "drinkWaterReminder";
const OFFSCREEN_URL = "offscreen.html";

const DEFAULTS = {
  interval: 60, // minutes
  soundEnabled: true,
  volume: 0.25,
};

// Only one offscreen document may exist at a time, and creating a second one
// throws. Hold the in-flight creation so overlapping calls await the same work.
let creatingOffscreen = null;

// Chimes are played one at a time. Overlapping alarms would otherwise race to
// close the shared offscreen document out from under each other.
let playbackQueue = Promise.resolve();

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }
  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: "Play a chime alongside the drink water reminder.",
  });
  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

function playChime() {
  playbackQueue = playbackQueue.then(runChime, runChime);
  return playbackQueue;
}

async function runChime() {
  const { soundEnabled, volume } = await chrome.storage.sync.get({
    soundEnabled: DEFAULTS.soundEnabled,
    volume: DEFAULTS.volume,
  });
  if (!soundEnabled) {
    return;
  }

  try {
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({
      target: "offscreen",
      type: "playChime",
      volume: volume,
    });
  } catch (error) {
    // A failed chime must never stop the notification from being shown.
    console.error("Could not play the reminder chime:", error);
  } finally {
    try {
      if (await chrome.offscreen.hasDocument()) {
        await chrome.offscreen.closeDocument();
      }
    } catch (error) {
      // Already gone; nothing to clean up.
    }
  }
}

// Listen for the alarm and show the notification
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon-128.png",
      title: "Time to Drink Water!",
      message: "Stay hydrated. Drink a glass of water now!",
      priority: 2,
      // Stay on screen until dismissed, so it is still there when you look
      // back at the primary display.
      requireInteraction: true,
    });
    playChime();
  }
});

// Let the options page preview the chime through the real playback path
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "testSound") {
    return;
  }
  playChime().then(() => sendResponse({ ok: true }));
  return true; // keep the message channel open for the async reply
});

// Set an alarm based on user-defined interval
function setAlarm(interval) {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: interval });
  });
}

// Load the interval from storage and set the alarm
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["interval"], (result) => {
    const interval = result.interval || DEFAULTS.interval;
    setAlarm(interval);
  });
});

// Update the alarm when the interval is changed
chrome.storage.onChanged.addListener((changes) => {
  if (changes.interval) {
    setAlarm(changes.interval.newValue);
  }
});
