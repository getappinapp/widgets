# Timer

Pomodoro timer widget with a rounded time-based outline.


## Features

- 25-minute Pomodoro countdown with a rounded-rectangle progress outline
- Color-shifting progress (green → yellow → red) or desktop-tint via `window.vibeBG`
- Click to start/stop, double-click to reset
- Completion sound (`end.mp3`) via `afplay`
- Scales proportionally from a single `height` value

## How it works

- `index.jsx` implements the `Timer` component with module-level countdown state ticking every second (`refreshFrequency = 1000`).
- Progress is rendered as an SVG rect `stroke-dashoffset` around the time text; on expiry the timer resets and plays `end.mp3`.

## Customization

- **Duration**: change `POMODORO_MINUTES` at the top of `index.jsx`.
- **Size**: only change the `height` export — everything else (width, font size, stroke, radius) scales via `scale = height / BASE_HEIGHT` (`BASE_HEIGHT = 80`).
- **Position on screen**: adjust the `x` / `y` exports.
- **Appearance**: edit styles/JSX in `index.jsx` to change colors, fonts, or the progress visuals.
- **Sound**: replace `end.mp3` with your own completion sound.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Click the timer to start/stop; double-click to reset. For quick testing, temporarily set `POMODORO_MINUTES` to a small value.

## License

MIT
