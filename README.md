# prod-widgets

A collection of desktop widgets for [Appinapp](https://appinapp.mutawirr.uz) — clocks, timers, productivity, system stats, and API-driven widgets. Each widget is a self-contained folder with an `index.jsx`, a `widget.json` manifest, a `README.md`, and a `screenshot.png`.

## Widgets

| Widget | Description |
| ------ | ----------- |
| [Age-Counter](./Age-Counter.widget/) | A real-time age counter displaying your exact age in years with 9 decimal places. |
| [Airpods-battery](./Airpods-battery.widget/) | Shows your AirPods battery levels (left, right, case) via `system_profiler`. |
| [Battery-chart](./Battery-chart.widget/) | Tracks battery level over time with a smooth SVG chart, charging detection, and time estimates. |
| [Block-timer](./Block-timer.widget/) | A multi-block session timer that runs labeled tasks back-to-back on a scrolling track. |
| [Currency](./Currency.widget/) | Current USD → UZS rate from the Central Bank of Uzbekistan API, with on-disk caching. |
| [Currency-new](./Currency-new.widget/) | USD/UZS rate with daily change and an interactive 11-day trend chart. |
| [Date](./Date.widget/) | Current day of the week in a large custom (Anurati) font, refreshed daily. |
| [Github-contributions](./Github-contributions.widget/) | Yearly GitHub commit activity rendered as a contribution heatmap. |
| [Horizontal-Clock](./Horizontal-Clock.widget/) | Horizontal clock with animated seconds and a parallax blur effect. |
| [Liquid-clock](./Liquid-clock.widget/) | Minimal analog clock with smooth second-hand animation over a background image. |
| [Reminders](./Reminders.widget/) | Incomplete macOS Reminders with due dates, priorities, and notes. |
| [Spotify-Player](./Spotify-Player.widget/) | Spotify now-playing widget with progress bar, marquee titles, and playback controls. |
| [Spotify-Player-New](./Spotify-Player-New.widget/) | Spotify now-playing widget with album-art-driven theming. |
| [Taqvim](./Taqvim.widget/) | Daily prayer (namoz) times for Tashkent in Uzbek (Latin). |
| [Timer](./Timer.widget/) | Pomodoro timer with a rounded time-based outline that scales from one `height` value. |
| [Todo](./Todo.widget/) | Minimal glassy to-do list with quick-add, one-click complete, and persistent tasks. |

Each widget folder has its own `README.md` with features, how it works, and customization options.

## Installation

1. Copy the widget folder you want (e.g. `Todo.widget/`) into your Appinapp widgets directory.
2. If the widget ships a shell helper (`rates.sh`), open widget's folder on terminal and make it executable where needed, e.g.:
   ```sh
   chmod +x ./rates.sh
   ```
3. The widget appears on your desktop — size/position are controlled by the `width`, `height`, `x`, `y` exports at the top of its `index.jsx`.

## Repository structure

```
<Name>.widget/
├── index.jsx      # widget UI + exports (command, refreshFrequency, width, height, x, y, className)
├── widget.json    # name, description, author email (Block-timer uses widgets.json)
├── README.md      # per-widget docs (shared template: Features / How it works / Customization / Notes / License)
└── screenshot.png # preview image
```

## Widget README template

All per-widget READMEs follow the same template:

```md
# Title

<one-line description>

![screenshot](./screenshot.png)

## Features
## How it works
## Customization
## Notes
## License

MIT
```

## Notes

- Widgets with a shell `command` (`Airpods-battery`, `Battery-chart`, `Currency`, `Currency-new`, `Reminders`, `Spotify-Player`, `Spotify-Player-New`, `Taqvim`) poll on `refreshFrequency`; the rest render on internal timers or pure UI state.
- Network-dependent widgets (`Currency`, `Currency-new`, `Github-contributions`, `Taqvim`) need API access; `Currency` widgets fall back to cached data offline.
- macOS-only widgets: `Airpods-battery` (Bluetooth + `system_profiler`), `Reminders` (Reminders app + Automation permission), `Spotify-Player` / `Spotify-Player-New` (Spotify desktop app + AppleScript).

## License

MIT — see [LICENSE](./LICENSE).
