// Listen for the alarm and show the notification
chrome.alarms.onAlarm.addListener(() => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Time to Drink Water!',
      message: 'Stay hydrated. Drink a glass of water now!',
      priority: 2
    });
  });
  
  // Set an alarm based on user-defined interval
  function setAlarm(interval) {
    chrome.alarms.clearAll(() => {
      chrome.alarms.create('drinkWaterReminder', { periodInMinutes: interval });
    });
  }
  
  // Load the interval from storage and set the alarm
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['interval'], (result) => {
      const interval = result.interval || 60; // Default to 60 minutes if not set
      setAlarm(interval);
    });
  });
  
  // Update the alarm when the interval is changed
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.interval) {
      setAlarm(changes.interval.newValue);
    }
  });
  