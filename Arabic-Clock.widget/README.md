# Arabic Clock

A large Arabic-numeral clock with date, using a custom Arabic font.

## Features

- Displays current time in Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) at 135px
- Shows date below in localized format (weekday, day, month)
- Custom embedded Arabic font (`arabic.ttf`) loaded via `@font-face`
- Updates every second via internal timer
- Clean, minimal design with centered layout

## How it works

The widget renders an `ArabicClock` React component:

1. `useState` + `setInterval` updates `now` every 1000ms
2. Time formatted as `HH:MM` via `pad()` helper
3. Date formatted via `toLocaleDateString` with `weekday: "short"`, `day: "numeric"`, `month: "long"` (uses system locale)
4. `Scritto` component renders the time with the custom Arabic font with animations
5. CSS `@font-face` loads `arabic.ttf` from the widget folder
6. Fixed size 380×150 defined in both component styles and `config.json`

## Customization

Edit `config.json`:

- `width`, `height`: Widget dimensions (default 380×150)
- `x`, `y`: Position (default 595, 102)
- `renderMode`: `"board"` (desktop board, not menu bar)
- `refreshFrequency`: `null` (uses internal timer, no polling)

Edit `index.jsx`:

- Font size: `.time` font-size (line 50, default 135px)
- Date style: `.date` font-size, weight, color (lines 44-48)
- Time color: `.time` color (line 55, default `#ffffffd1`)
- Date format: `toLocaleDateString` options (lines 17-21)
- Font: Replace `arabic.ttf` in widget folder

## Notes

- Pure UI widget — no shell commands, no network, no polling
- Uses `renderMode: "board"` for desktop placement (not menu bar)
- Requires `Scritto` component available globally (`window.Scritto`)
- Font file `arabic.ttf` must be in the widget folder
- `onAllWorkspaces: true` shows on all macOS spaces

## License

MIT
