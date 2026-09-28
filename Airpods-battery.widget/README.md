# AirPods Battery

Shows your AirPods battery in a compact widget UI.

![screenshot](./screenshot.png)

## Features

- Shows battery levels for left AirPod, right AirPod, and charging case
- Automatic light/dark theme based on system appearance
- Color-coded battery indicators (green, yellow, red)
- Respects reduced motion preferences
- Refreshes every 30 seconds

## How it works

- `index.jsx` exports a `command` running `system_profiler SPBluetoothDataType -json` and parses the connected AirPods battery levels on every `refreshFrequency` tick (`30000` ms).

## Customization

- **Size**: adjust the `width` / `height` exports (`200` / `175`).
- **Position on screen**: adjust the `x` / `y` exports.
- **Refresh interval**: change `refreshFrequency` in `index.jsx`.
- **Colors and layout**: edit `index.jsx` to change indicators, fonts, or theming.

## Notes

- Requires macOS with Bluetooth enabled, AirPods connected, and the case opened to populate data.

## License

MIT
