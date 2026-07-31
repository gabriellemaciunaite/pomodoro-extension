chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_TIMER') {
        startTimer((targetTime) => sendResponse({ success: true, targetTime }));
        return true; 
    } else if (message.action === 'STOP_TIMER') {
        stopTimer(() => sendResponse({ success: true }));
        return true;
    }
});

function startTimer(callback) {
    const targetTime = Date.now() + 1 * 60 * 1000;
    chrome.storage.local.set({ isRunning: true, targetTime: targetTime }, () => {
        chrome.alarms.create('pomodoroAlarm', { delayInMinutes: 1 });
        if (callback) callback(targetTime);
    });
}

function stopTimer(callback) {
    chrome.alarms.clear('pomodoroAlarm', () => {
        chrome.storage.local.set({ isRunning: false, targetTime: null }, () => {
            if (callback) callback();
        });
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroAlarm') {
        stopTimer();
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Pomodoro timer finished!',
            message: 'Enjoy your 5 minute break.',
            priority: 1
        });
    }
});