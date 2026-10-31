# Uliza Chat for Windows

A small Windows app that opens the staff WhatsApp chat (`https://ulizatickets.com/admin/whatsapp-chat`) in its own window.

- Keeps running in the system tray when closed, so incoming WhatsApp calls still ring. Quit from the tray icon.
- Flashes the taskbar button when a new chat is unread.
- Microphone access is granted only to Uliza pages (for voice calls); other links open in your normal browser.
- Updates itself from the latest GitHub release.

The window stays on Chat and sign-in pages. Other links open externally.
Camera permissions are refused; microphone permissions require both the
trusted origin and an active Chat page.

## Releasing

The GitHub Actions workflow `.github/workflows/release.yml` builds `Uliza-Chat-Setup.exe` on Windows and attaches it to a GitHub release.

1. Bump `version` in `package.json`.
2. Push a tag `chat-v<version>` (for example `chat-v1.0.1`), or run the workflow manually from the Actions tab. Tags follow `chat-v<version>`.

Download link for staff: https://github.com/ulizalinks/uliza-chat-desktop/releases/latest/download/Uliza-Chat-Setup.exe

The `afterAllArtifactBuild` hook runs navigation/permission tests and launches
the packaged Windows EXE against a local-only fixture before the build can
succeed. It verifies the desktop user agent, sandbox, login return, blocked
admin navigation and tray hide/restore. A failure prevents the existing
workflow's publish step. This does not test physical audio, a signed-in
production account, or an upgrade over a staff member's existing installation.

Changing `ULIZA_CHAT_URL` disables automatic update checks for that test run,
so fixture runs cannot fetch or install a production update.

The web workspace is hosted separately: publishing a desktop release does not
publish dashboard, CRM, onboarding or login changes on the website.

The installer is not code-signed, so Windows SmartScreen shows "Windows protected your PC" the first time: click **More info → Run anyway**.

## Local run

```
npm install
npm start
```
Set `ULIZA_CHAT_URL` to point at another server while testing.
