# Uliza Chat for Windows

A small Windows app that opens the staff WhatsApp chat (`https://ulizatickets.com/admin/whatsapp-chat`) in its own window.

- Keeps running in the system tray when closed, so incoming WhatsApp calls still ring. Quit from the tray icon.
- Flashes the taskbar button when a new chat is unread.
- Microphone access is granted only to Uliza pages (for voice calls); other links open in your normal browser.
- Updates itself from the latest GitHub release.

## Releasing

The GitHub Actions workflow `.github/workflows/release.yml` builds `Uliza-Chat-Setup.exe` on Windows and attaches it to a GitHub release.

1. Bump `version` in `package.json`.
2. Push a tag `chat-v<version>` (for example `chat-v1.0.1`), or run the workflow manually from the Actions tab. Tags follow `chat-v<version>`.

Download link for staff: https://github.com/ulizalinks/uliza-chat-desktop/releases/latest/download/Uliza-Chat-Setup.exe

The installer is not code-signed, so Windows SmartScreen shows "Windows protected your PC" the first time: click **More info → Run anyway**.

## Local run

```
npm install
npm start
```
Set `ULIZA_CHAT_URL` to point at another server while testing.
