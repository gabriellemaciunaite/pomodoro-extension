## Pomodoro Timer & Domain Blocker Extension

A lightweight Manifest V3 Google Chrome extension designed to aid students/workers by allowing the user to start a 25-minute Pomodoro timer and restricting user-defined websites when active.

---

## Technical Features

* **Background-Driven Pomodoro Engine**: Maintains accurate time tracking independently of active popup UI state.
* **Network-Level Domain Blocking**: Leverages Chrome's `declarativeNetRequest` API for domain filtering across primary sites and all associated subdomains.
* **Offline Service Worker Purging**: Purges origin-specific Service Workers/browser storage on session launch, preventing applications from serving cached offline content.
* **System Notifications**: Emits native OS/desktop alerts upon focus session completion.
