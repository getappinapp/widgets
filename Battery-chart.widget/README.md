# Battery Chart

A widget that tracks battery level over time with a smooth SVG chart.

![screenshot](./screenshot.png)

## Features

- **Real-time battery level** — shows current percentage and charging status
- **10-hour history chart** — smooth cubic Bézier curve tracking battery drain/charge over time
- **Charging detection** — color-coded chart: green when on battery, blue when charging
- **Gradient fills** — subtle gradient area under the chart line
- **Time estimates** — displays `Should last Xh` on battery or `Xh Xm until full` when charging
- **Auto-refresh** — updates every 60 seconds
- **Persistent history** — stores readings in a local CSV file, pruned to a 10-hour window

## How it works

- `index.jsx` exports a `command` that reads `pmset -g batt`, appends `timestamp,percent,charging` to `appinapp-battery-history.csv`, prunes entries older than 10 hours, and returns the current state plus history as JSON for the SVG chart.

## Customization

- **History window**: change `WINDOW_HOURS` in the `command` export (default: `10`).
- **History file**: change the `FILE` path in the `command` export.
- **Size**: adjust the `width` / `height` exports (`200` / `180`).
- **Position on screen**: adjust the `x` / `y` exports.
- **Refresh interval**: change `refreshFrequency` in `index.jsx` (default: 60 seconds).
- **Colors**: edit the chart stroke/gradient values in `index.jsx`.

## Notes

- Battery history is stored inside the widget folder as `appinapp-battery-history.csv`.

## License

MIT
