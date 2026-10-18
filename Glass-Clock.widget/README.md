# Glass Clock

A minimal digital clock (12-hour, `H:MM`) styled like frosted glass — translucent white digits with highlighted top and bottom edges.

## Features

- Large glass-effect time built from two stacked text layers
- Translucent white fill with a soft drop shadow
- Edge highlight via an SVG `feOffset` / `feComposite` filter
- 12-hour format, updates every second
- Custom embedded `SF Pro` font (`sf-pro.otf`)
- Fixed 442×195 board widget that sits on all workspaces

## How it works

The widget renders a `GlassClock` React component:

1. `useState` + `setInterval` updates `time` every 1000ms using a 12-hour `H:MM` formatter.
2. Two copies of the time are stacked in a CSS grid cell:
   - **Fill layer** — translucent white text (`#ffffff30`) with a drop shadow for depth.
   - **Edge layer** — white text clipped by the SVG `#glass-edges` filter, which keeps only the top and bottom glyph edges to simulate a beveled glass rim.
3. The root uses `containerType: "size"` so the font size scales with `min(142cqh, 37cqw)`.

## Customization

Edit `config.json`:

- `width`, `height`: Widget dimensions (default 442×195)
- `x`, `y`: Position (default 631, 109)
- `renderMode`: `"board"` (desktop board, not menu bar)
- `refreshFrequency`: `null` (no polling; uses internal timer)
- `liquidGlass`: optional native glass variant (disabled by default)

Edit `index.jsx`:

- `format(d)`: Time formatting (change to 24-hour, add seconds, etc.)
- `styles.fill`: Glass fill color and shadow (default `#ffffff30`)
- `styles.edge`: Edge opacity (default `0.5`)
- Font size: `styles.grid` `fontSize` (`min(142cqh, 37cqw)`)
- Font: Replace `sf-pro.otf` in the widget folder

## Notes

- Pure UI widget — no shell commands, no network, no polling.
- `onAllWorkspaces: true` shows the widget on all macOS spaces.

## License

MIT
