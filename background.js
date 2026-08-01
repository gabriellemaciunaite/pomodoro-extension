chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_TIMER') {
        chrome.storage.local.get(['blacklist'], (data) => {
            const blacklist = data.blacklist || [];
            clearStorageForDomains(blacklist);
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

async function enableBlocking(blacklist) {
  if (!blacklist?.length) return console.warn('No domains in blacklist to block.');
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);

  const addRules = blacklist.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: { 
      urlFilter: `||${domain.replace(/^(?:https?:\/\/)?(?:www\.)?|\/.*$/gi, '').trim()}^`, 
      resourceTypes: ['main_frame'] 
    }
  }));

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
    console.log('Successfully applied blocking rules:', addRules);
  }
  catch (err) {
    console.error('Blocking Rule Error:', err.message);
  }
}

async function disableBlocking() {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = rules.map(r => r.id);
    if (!removeRuleIds.length) return console.log('No active rules to remove.');
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
    console.log('Successfully removed all blocking rules.');
  }
  catch (err) {
    console.error('Unblock Error:', err.message);
  }
}

function clearStorageForDomains(blacklist) {
    if (!blacklist || blacklist.length === 0) return;
    const origins = blacklist.flatMap(domain => {
        const clean = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].trim();
        return [`https://${clean}`, `https://www.${clean}`];
    });

    chrome.browsingData.remove(
        { origins }, 
        { serviceWorkers: true, cacheStorage: true, cache: true, localStorage: true, indexedDB: true }
    )
    .then(() => console.log('Successfully cleared all storage origins.'))
    .catch(err => console.error(err.message));
}