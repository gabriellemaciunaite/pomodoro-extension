chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_TIMER') {
        const targetTime = Date.now() + 1 * 60 * 1000;
        chrome.storage.local.set({ isRunning: true, targetTime: targetTime });
        chrome.alarms.create('pomodoroAlarm', { delayInMinutes: 1 });
    } else if (message.action === 'STOP_TIMER') {
        chrome.alarms.clear('pomodoroAlarm');
        chrome.storage.local.set({ isRunning: false, targetTime: null });
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroAlarm') {
        chrome.storage.local.set({ isRunning: false, targetTime: null });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Pomodoro timer finished!',
            message: 'Enjoy your 5 minute break.',
            priority: 1
        });
    }
});