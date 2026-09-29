# Spotify Player

A Spotify now-playing widget with playback progress, marquee titles, and play/pause/next/prev controls.


## Features

- Current track name, artist, and album artwork with scrolling marquee for long titles
- Live progress bar with elapsed/total time
- Play/pause, next, and previous controls via `osascript`
- Album-art-driven theming with contrast-corrected text
- Refreshes every 500ms

## How it works

- `index.jsx` exports a `command` that uses `pgrep` + `osascript` to query Spotify for `name|artist|artworkUrl|playerState|duration|position`.
- Control buttons send AppleScript commands (`playpause`, `next track`, `previous track`) back to the Spotify app.

## Customization

- **Size**: adjust the `width` / `height` exports (`250` / `70`).
- **Position on screen**: adjust the `x` / `y` exports.
- **Refresh interval**: change `refreshFrequency` in `index.jsx` (default: 500ms).
- **Marquee**: tune `MARQUEE_GAP`, `MARQUEE_SPEED`, and `MARQUEE_HOLD_MS` at the top of `index.jsx`.
- **Fallback art**: replace `default.jpg` with your own placeholder image.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Requires the Spotify desktop app running on macOS with AppleScript access enabled.

## License

MIT
