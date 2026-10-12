# Menu Clock

A compact menu bar clock that expands into a 7-day calendar view on click.

## Features

- Displays current time (HH:MM) in a minimal pill-shaped widget
- Click to expand and reveal a 7-day calendar (−3 to +3 days from today)
- Smooth animated expand/collapse with spring-like transitions
- Today highlighted with larger date number and distinct colors
- Weekend days (Sat/Sun) shown in red
- Auto-collapses on mouse leave after a short delay
- Zero external dependencies — runs entirely on internal timers

## How it works

The widget renders a `CalendarPill` React component that maintains its own internal state:
- A `setInterval` updates the time every second
- Click toggles `open` state, triggering a queued resize animation (height then width)
- `onMouseLeave` triggers collapse after a 450 ms delay, but only if not re-opened
- The calendar shows 7 days centered on today, with day labels (full name for today, single letter for others)
- Opacity fades for days further from today (1.0 → 0.7 → 0.4 → 0.12)
- All sizing and positioning controlled by exports at the top of `index.jsx` (`width`, `height`, `x`, `y`)

## Customization

Edit the constants at the top of `index.jsx`:

| Constant | Default | Description |
|----------|---------|-------------|
| `COLLAPSED` | `{ w: 70, h: 29 }` | Size when collapsed (time only) |
| `EXPANDED` | `{ w: 240, h: 108 }` | Size when expanded (time + calendar) |
| `CLOSE_DELAY` | `450` | Ms before auto-collapse on mouse leave |
| `LETTERS` / `NAMES` | `["S","M","T","W","T","F","S"]` / `["SUN","MON",...]` | Day label strings |
| Colors | Various | Modify CSS in the `className` export (`.cp-time`, `.cp-weekend`, `.cp-today`, etc.) |

To change default position, edit `x`, `y`, `width`, `height` in `config.json`.

## Notes

- Pure UI widget — no shell commands, no network calls, no file I/O
- Uses `renderMode: "window"` with `zIndex: "top"` and `onAllWorkspaces: true` (configured in `config.json`)
- Designed for menu bar placement (default `y: 2`, `x: 900`)
- Font uses system stack (`-apple-system`, `SF Pro Display`, etc.)

## License

MIT