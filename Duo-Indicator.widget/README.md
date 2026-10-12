# Duo Indicator

Shows battery, Wi-Fi, and network status with a IPhone Duo style ring indicator.

## Features

- Battery level shown as a progress ring
- Ring color changes: green when charging, red ≤20%, amber ≤30%, white otherwise
- Wi-Fi glyph with state-aware coloring:
  - Full opacity white = online
  - Amber = captive portal / network intercepted
  - Dimmed = offline
- Red slash through Wi-Fi when Wi-Fi is powered off
- Tooltip shows battery percentage and network state
- Polls system every 15 seconds via shell command

## How it works

The widget exports a shell `command` that runs on `refreshFrequency` (15000 ms):

1. Detects Wi-Fi interface via `networksetup -listallhardwareports`
2. Gets battery level and AC status via `pmset -g batt`
3. Checks Wi-Fi power state via `networksetup -getairportpower`
4. Determines network reachability via `scutil --nwi` (flags: 2=reachable, 4=requires connection)
   - `STATE=1` = online (reachable, no connection required)
   - `STATE=2` = captive portal (reachable but connection required)
   - `STATE=0` = offline
5. Outputs pipe-delimited string: `BATTERY%|CHARGING|WIFI_ON|STATE`

The React component parses this output and renders:

- An SVG with two arc paths (track + progress) using polar coordinate math
- Duo Wi-Fi glyph paths (from original 1024×1024 viewBox)
- Conditional slash line when Wi-Fi is off
- CSS custom properties for colors (`--duo-fg`, `--duo-track`)

## Customization

Edit `config.json`:

- `refreshFrequency`: Poll interval in ms (default 15000)
- `width`, `height`, `x`, `y`: Size and position

Edit `index.jsx` constants:
| Constant | Default | Description |
|----------|---------|-------------|
| `C`, `R`, `SW` | `512`, `450`, `90` | Ring center, radius, stroke width |
| `START`, `SPAN` | `211.3`, `297.3` | Arc start angle and sweep (degrees) |
| `ringColor` logic | Green/Red/Amber/White | Battery level thresholds at lines 50-53 |
| `onlineOpacity` | `1 / 0.8 / 0.45` | Opacity for online/captive/offline at line 56 |
| `--duo-fg`, `--duo-track` | `#fff`, `#ffffff3d` | CSS variables in `className` export |

## Notes

- macOS only — uses `networksetup`, `pmset`, `scutil`
- Requires `refreshFrequency` polling (not pure UI)
- Small 29×29 footprint designed for menu bar placement
- `renderMode: "window"` with `onAllWorkspaces: true`

## License

MIT
