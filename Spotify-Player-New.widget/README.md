# Spotify Player New

A Spotify now-playing widget showing the current track with album-art-driven theming.


## Features

- Current track name, artist, and album artwork
- Background and text colors derived from the album art (k-means + contrast correction)
- Fallback artwork (`default.jpg`) when nothing is playing
- Refreshes every second

## How it works

- `index.jsx` exports a `command` that uses `pgrep` + `osascript` to query Spotify for the current track (`name|artist|artworkUrl`), or returns `Not Running`.
- The UI preloads artwork, samples its dominant colors, and re-themes the card to keep text readable.

## Customization

- **Size**: adjust the `width` / `height` exports (`250` / `230`).
- **Position on screen**: adjust the `x` / `y` exports.
- **Refresh interval**: change `refreshFrequency` in `index.jsx` (default: 1 second).
- **Fallback art**: replace `default.jpg` with your own placeholder image.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Requires the Spotify desktop app running on macOS with AppleScript access enabled.

## License

MIT
