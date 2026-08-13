// Caches popup.html DOM elements for later scripts
const blacklistList = document.getElementById('blacklist');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const timer = document.getElementById('timer');
const saveButton = document.getElementById('save-blacklist');

let timerInterval = null;

// Retrieve chrome.storage.local API data to initialize timer state
chrome.storage.local.get(['blacklist', 'targetTime', 'isRunning'], (data) => {
    if (data?.blacklist) blacklistList.value = data.blacklist.join('\n');
    adjustTimer(data?.isRunning, data?.targetTime);
});

// Synchronize popup UI state when storage updates externally
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        chrome.storage.local.get(['isRunning', 'targetTime'], (data) => adjustTimer(data?.isRunning, data?.targetTime));
    }
});

// Pass UI interactions to background.js
startButton.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'START_TIMER' }));
stopButton.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'STOP_TIMER' }));

/**
 * Updates UI control states and starts or resets the countdown timer.
 */
function adjustTimer(isRunning, targetTime) {
    if (isRunning && targetTime) {
        setRunningState(true);
        startTimer(targetTime);
    } else {
        setRunningState(false);
        clearInterval(timerInterval);
        timer.textContent = '01:00';
    }
}

// Toggle start and stop button state
function setRunningState(running) {
    startButton.disabled = running;
    stopButton.disabled = !running;
}

function startTimer(targetTime) {
    const update = () => {
        // Calculate minute and second value using remaining val
        const remaining = Math.max(0, Math.round((targetTime - Date.now()) / 1000));
        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        timer.textContent = `${mins}:${secs}`;
        // If timer runs out reset UI elements and stop interval
        if (remaining <= 0) {
            clearInterval(timerInterval);
            setRunningState(false);
            timer.textContent = '01:00';
        }
    };
    update();
    timerInterval = setInterval(update, 1000);
}

// Parses input text, saves formatted domain list, and starts block if timer is active
saveButton.addEventListener('click', () => {
    const val = blacklistList.value || '';
    const domains = val.split('\n').map(d => d.trim().toLowerCase()).filter(d => d.length > 0);
    chrome.storage.local.set({ blacklist: domains }, () => {
        showStatus('Successfully saved', 'success');
        clearInterval(timerInterval);
        chrome.storage.local.get(['isRunning'], (data) => {
            if (data.isRunning) chrome.runtime.sendMessage({ action: 'START_BLOCK' });
        });
    });
});

// Visual feedback on popup.html on save button upon success/failure
function showStatus(message, type = 'success') {
    const originalText = saveButton.textContent;
    const originalColour = window.getComputedStyle(saveButton).backgroundColor;
    saveButton.textContent = message;
    saveButton.style.backgroundColor = type === 'error' ? '#e11d48' : '#16a34a';

    setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.style.backgroundColor = originalColour;
    }, 2000);
}