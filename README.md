## Pomodoro Timer & Domain Blocker Extension

A lightweight Manifest V3 Google Chrome extension designed to aid students/workers by allowing the user to start a 25-minute Pomodoro timer and restricting user-defined websites when active.

---

### Technical Features

* **Background-Driven Pomodoro Engine**: Maintains accurate time tracking independently of active popup UI state.
* **Network-Level Domain Blocking**: Leverages Chrome's `declarativeNetRequest` API for domain filtering across primary sites and all associated subdomains.
* **Offline Service Worker Purging**: Purges origin-specific Service Workers/browser storage on session launch, preventing applications from serving cached offline content.
* **System Notifications**: Emits native OS/desktop alerts upon focus session completion.
  
---

### Installation (Developer Mode)

#### 1. Clone the Repository

Open your terminal and run:

```
git clone https://github.com/gabriellemaciunaite/pomodoro-extension.git
cd pomodoro-extension

```

#### 2. Load into Chrome

- Open Chrome and navigate to `chrome://extensions/`.
- Toggle **Developer mode** ON in the top right corner.
- Click **Load unpacked** in the top left corner.
- Select the project directory (in this case, `pomodoro-extension`) containing `manifest.json`.

---

#### Quick Updates

To receive updates, reload the extension via your CLI and then press the **Reload** icon:

```
# Pull latest changes from GitHub
git pull origin main
```
