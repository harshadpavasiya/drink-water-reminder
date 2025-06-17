document.addEventListener("DOMContentLoaded", () => {
  const intervalInput = document.getElementById("interval");
  const nextAlarmInfo = document.getElementById("nextAlarmInfo");
  const now = Date.now();

  // Load the saved interval
  chrome.storage.sync.get(["interval", "alarmCreatedAt"], (result) => {
    intervalInput.value = result.interval || 60;
    const nextAlarm = new Date(result.alarmCreatedAt + result.interval * 60 * 1000);
    nextAlarmInfo.textContent = `Next alarm at: ${nextAlarm.toLocaleTimeString()}`;
  });

  // Save function
  function saveSettings() {
    const interval = parseInt(intervalInput.value);
    if (interval > 0 && interval < 120) { // Limit to 2 hours max
      const now = Date.now();
      chrome.storage.sync.set({ interval: interval, alarmCreatedAt: now }, () => {
          nextAlarmInfo.textContent = `Next alarm at: ${new Date(now + interval * 60 * 1000).toLocaleTimeString()}`;
          alert("Interval saved!");
        });
    } else {
      alert("Please enter a valid number greater than 0.");
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
