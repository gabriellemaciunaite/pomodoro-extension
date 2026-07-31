chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_TIMER') {
        chrome.storage.local.get(['blacklist'], (data) => {
            const blacklist = data.blacklist || [];
            enableBlocking(blacklist);
        });
        const targetTime = Date.now() + 1 * 60 * 1000;
        chrome.storage.local.set({ isRunning: true, targetTime: targetTime });
        chrome.alarms.create('pomodoroAlarm', { delayInMinutes: 1 });
    } else if (message.action === 'STOP_TIMER') {
        chrome.alarms.clear('pomodoroAlarm');
        chrome.storage.local.set({ isRunning: false, targetTime: null });
        disableBlocking();
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroAlarm') {
        disableBlocking();
        chrome.storage.local.set({ isRunning: false, targetTime: null });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon.png'),
            title: 'Pomodoro timer finished!',
            message: 'Enjoy your break.',
            priority: 1
        });
    }
});

function enableBlocking(blacklist) {
    if (!blacklist || blacklist.length === 0) {
        console.warn('No domains in blacklist to block.');
        return;
    }

    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const ids = existingRules.map(rule => rule.id);
        
        const rules = blacklist.map((domain, index) => {
            // Remove protocol, www, and path trailing slashes
            const cleanDomain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].trim();
            
            return {
                id: index + 1,
                priority: 1,
                action: { type: 'block' },
                condition: { 
                    urlFilter: `||${cleanDomain}^`, 
                    resourceTypes: ['main_frame'] 
                }
            };
        });

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ids,
            addRules: rules
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Blocking Rule Error:', chrome.runtime.lastError.message);
            } else {
                console.log('Successfully applied blocking rules:', rules);
            }
        });
    });
}

function disableBlocking() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        let ids = rules.map(rule => rule.id);
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids }, () => {
            if (chrome.runtime.lastError) {
                console.error('Unblock Error:', chrome.runtime.lastError.message);
            } else {
                console.log('Successfully removed all blocking rules.');
            }
        });
    });
}
