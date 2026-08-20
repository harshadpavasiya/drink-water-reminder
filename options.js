const ALARM_NAME = "drinkWaterReminder";
const MIN_INTERVAL = 1;
const MAX_INTERVAL = 120; // 2 hours

const DEFAULTS = {
  interval: 60,
  soundEnabled: true,
  volume: 0.25,
};

document.addEventListener("DOMContentLoaded", () => {
  const intervalInput = document.getElementById("interval");
  const soundInput = document.getElementById("soundEnabled");
  const volumeInput = document.getElementById("volume");
  const volumeValue = document.getElementById("volumeValue");
  const volumeGroup = document.getElementById("volumeGroup");
  const testButton = document.getElementById("test");
  const nextAlarmInfo = document.getElementById("nextAlarmInfo");

  // Read the real scheduled time from the alarm itself, so the page is correct
  // even on a fresh install where nothing has been saved yet.
  function showNextAlarm() {
    chrome.alarms.get(ALARM_NAME, (alarm) => {
      nextAlarmInfo.textContent = alarm
        ? `Next alarm at: ${new Date(alarm.scheduledTime).toLocaleTimeString()}`
        : "No reminder scheduled yet.";
    });
  }

  function showVolume() {
    volumeValue.textContent = `${volumeInput.value}%`;
    // Nothing to set the level of when the chime is switched off.
    volumeGroup.classList.toggle("disabled", !soundInput.checked);
    volumeInput.disabled = !soundInput.checked;
    testButton.disabled = !soundInput.checked;
  }

  // Load the saved settings
  chrome.storage.sync.get(DEFAULTS, (result) => {
    intervalInput.value = result.interval;
    soundInput.checked = result.soundEnabled;
    volumeInput.value = Math.round(result.volume * 100);
    showVolume();
    showNextAlarm();
  });

  // Keep the displayed time from going stale once a reminder fires
  setInterval(showNextAlarm, 5000);

  soundInput.addEventListener("change", showVolume);
  volumeInput.addEventListener("input", showVolume);

  // Preview through the real playback path, so this tests what actually runs
  testButton.addEventListener("click", () => {
    testButton.disabled = true;
    chrome.storage.sync.set(
      {
        soundEnabled: soundInput.checked,
        volume: parseInt(volumeInput.value, 10) / 100,
      },
      () => {
        chrome.runtime.sendMessage({ type: "testSound" }, () => {
          testButton.disabled = !soundInput.checked;
        });
      }
    );
  });

  // Save function
  function saveSettings() {
    const interval = parseInt(intervalInput.value, 10);
    if (interval >= MIN_INTERVAL && interval <= MAX_INTERVAL) {
      chrome.storage.sync.set(
        {
          interval: interval,
          soundEnabled: soundInput.checked,
          volume: parseInt(volumeInput.value, 10) / 100,
        },
        () => {
          // The service worker rebuilds the alarm in response to this change.
          setTimeout(showNextAlarm, 300);
          alert("Settings saved!");
        }
      );
    } else {
      alert(
        `Please enter a whole number of minutes between ${MIN_INTERVAL} and ${MAX_INTERVAL}.`
      );
    }
  }

  // Save on button click
  document.getElementById("save").addEventListener("click", () => {
    saveSettings();
  });

  // Save on Enter key press
  intervalInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      saveSettings();
    }
  });
});
