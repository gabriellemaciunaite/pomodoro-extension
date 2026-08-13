// Listener for messages coming from the popup interface
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_TIMER') {
      beginBlock();
      const targetTime = Date.now() + 1 * 60 * 1000;
      chrome.storage.local.set({ isRunning: true, targetTime: targetTime });
      chrome.alarms.create('pomodoroAlarm', { delayInMinutes: 1 });
    } else if (message.action === 'STOP_TIMER') {
      chrome.alarms.clear('pomodoroAlarm');
      chrome.storage.local.set({ isRunning: false, targetTime: null });
      disableBlocking();
    } else if (message.action === 'START_BLOCK') {
      beginBlock();
    }
});

// Fire session wrap-up routines once the countdown alarm expires
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroAlarm') {
        disableBlocking();
        chrome.storage.local.set({ isRunning: false, targetTime: null });
        // Notify user their session has ended
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon.png'),
            title: 'Pomodoro timer finished!',
            message: 'Enjoy your 5 minute break.',
            priority: 1
        });
    }
});

// Fetch the user's blacklist and trigger storage clearing and domain blocking
function beginBlock() {
  chrome.storage.local.get(['blacklist'], (data) => {
      const blacklist = data.blacklist || [];
      // Wipe local site cache so pages can't bypass the block via cached assets
      clearStorageForDomains(blacklist);
      enableBlocking(blacklist);
  });
}

// Generates declarativeNetRequest dynamic rules to block access to blacklisted sites
async function enableBlocking(blacklist) {
  if (!blacklist?.length) return console.warn('No domains in blacklist to block.');

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);

  // Map each blacklisted domain into a standard blocking rule
  const addRules = blacklist.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: { 
      // Strip domain URLs into pure path
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

// Removes all active dynamic blocking rules from the browser session
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

// Delete site data (storage, cache, service workers) for blocked domains
function clearStorageForDomains(blacklist) {
    if (!blacklist || blacklist.length === 0) return;
    const origins = blacklist.flatMap(domain => {
      // Strip domain URLs into pure path
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