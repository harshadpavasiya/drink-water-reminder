document.addEventListener('DOMContentLoaded', () => {
    const intervalInput = document.getElementById('interval');
  
    // Load the saved interval
    chrome.storage.sync.get(['interval'], (result) => {
      intervalInput.value = result.interval || 60;
    });
  
    // Save the interval when the user clicks save
    document.getElementById('save').addEventListener('click', () => {
      const interval = parseInt(intervalInput.value);
      if (interval > 0) {
        chrome.storage.sync.set({ interval: interval }, () => {
          alert('Interval saved!');
        });
      } else {
        alert('Please enter a valid number greater than 0.');
      }
    });
  });
  