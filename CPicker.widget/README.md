# Color Picker

A color picker widget with native eyedropper and color format conversion.

## Features

- Click the pipette button to open the system color picker (WebKit) or native EyeDropper API (Chromium)
- Displays selected color as hex value in an expanding popover
- Click the popover to copy hex to clipboard (shows "copied ✓" feedback)
- Auto-closes after copy (600ms) or on Escape / click outside
- Icon and background tint adapt to the picked color's hue
- Smooth animated open/close with queued resize operations
- Zero external dependencies — uses built-in `<input type="color">` and `navigator.clipboard`

## How it works

The widget renders a `CPicker` React component:

1. A 28×28 button with an invisible `<input type="color">` overlay
2. On click:
   - Chromium: Uses `window.EyeDropper().open()` for native one-click eyedropper
   - WebKit: Opens the system color panel via the color input
3. On color change (`onChange`), the popover expands (height 28 → 54) and shows the hex value
4. Clicking the popover copies hex to clipboard via `navigator.clipboard.writeText` (with `document.execCommand` fallback)
5. Auto-close timer dismisses the popover and shrinks the widget back to 28×28
6. Resize operations are queued via a promise chain to prevent race conditions

Color adaptation logic (`hexToHsl`):
- Icon color: `hsl(h, min(s,80)%, 92%)` — whitish tint of the hue
- Background: `hsl(h, min(s,60)%, 10%)` — dark shade of the hue
- Border: `hsl(h, min(s,60)%, 25%)` — subtle border matching the hue

## Customization

Edit constants at the top of `index.jsx`:

| Constant | Default | Description |
|----------|---------|-------------|
| `BTN_SIZE` | `28` | Button size (px) |
| `POPOVER_W` | `100` | Popover width (px) |
| `POPOVER_H` | `24` | Popover height (px) |
| `POPOVER_GAP` | `2` | Gap between button and popover (px) |
| `OPEN_HEIGHT` | `54` | Total height when open (`BTN_SIZE + GAP + POPOVER_H`) |

Timing (in component):
- Copy auto-close: `600ms` (line 176)
- Copy failed reset: `1200ms` (line 179)

Edit `config.json` for position:
- `width`, `height`: Initial size (28×28)
- `x`, `y`: Position (default 827, 2 for menu bar)

## Notes

- Pure UI widget — no shell commands, no network, no polling
- Uses `renderMode: "window"` with `onAllWorkspaces: true`
- EyeDropper API only works in secure contexts (HTTPS/localhost) and Chromium-based browsers
- In WebKit (Appinapp), falls back to system color panel via `<input type="color">`
- Designed for menu bar placement (small 28×28 footprint)

## License

MIT