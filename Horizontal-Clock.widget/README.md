# Horizontal Clock

A sleek horizontal clock widget featuring smooth animated seconds transitions with a parallax blur effect.


## Features

- **Horizontal seconds display** — a scrolling row of seconds with a bright center and fading edges
- **Smooth animation** — seconds slide in with an ease-out cubic transition each tick
- **Depth blur layers** — multi-layer backdrop blur with gradient masks for a natural depth-of-field effect
- **Tabular numerals** — fixed-width digits prevent layout shift

## How it works

- `index.jsx` renders the current time with a scrolling seconds row; each tick advances the row with a CSS ease-out cubic transition while blur/gradient layers create the parallax depth effect.

## Customization

- **Size**: adjust the `width` / `height` exports (`150` / `180`).
- **Position on screen**: adjust the `x` / `y` exports.
- **Font**: edit the `font-family` (`Inter` / `SF Pro Display`).
- **Animation**: tweak the transition timing and blur layers in `index.jsx`.

## Notes

- No shell `command` is used — this widget is pure UI state, so it has no `refreshFrequency`.

## License

MIT
