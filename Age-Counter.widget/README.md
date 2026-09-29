# Age Counter

A real-time age counter displaying your exact age in years with 9 decimal places.


## Features

- Real-time age display, updating every 100ms
- Precise to 9 decimal places for an accurate representation of your age
- Clean, minimal design with a dark background and monospace font

## How it works

- `index.jsx` computes the fractional year difference between now and the `BIRTHDAY` constant on a `TICK_MS` interval and renders it as integer + decimal parts.

## Customization

- **Birth date**: change the `BIRTHDAY` constant near the top of `index.jsx` (format: `DD/MM/YYYY`).
- **Decimal places**: adjust the `DECIMAL_PLACES` constant.
- **Update speed**: change `TICK_MS` to control how often the age refreshes.
- **Size**: adjust the `width` / `height` exports.
- **Position on screen**: adjust the `x` / `y` exports.
- **Colors**: modify the `.int` and `.dec` color values for different text colors.

## Notes

- No shell `command` is used — this widget is pure UI state, so it has no `refreshFrequency`.
- Only `react` is imported, per the widget environment's limited module set.

## License

MIT
