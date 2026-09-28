# Date

Displays the current day of the week in large text using the custom Anurati font, refreshed once per day.

![screenshot](./screenshot.png)

## Features

- Large, centered day-of-week title
- Custom Anurati font embedded via base64 (no file-path issues in the webview)
- Refreshes once per day

## How it works

- `index.jsx` renders the day name using `toLocaleDateString` and applies the Anurati font via an embedded base64 `@font-face` declaration.

## Customization

- **Font**: replace `font.otf` with your own font file and update the base64 data URI in `index.jsx` (or use the file path directly).
- **Text size and spacing**: edit `fontSize` and `letterSpacing` in the `dayText` style object.
- **Size**: adjust the `width` / `height` exports.
- **Position on screen**: adjust the `x` / `y` exports.
- **Refresh interval**: change `refreshFrequency` to update more or less often than once per day.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- To use a different font, convert it to base64 (`base64 -i font.otf`) and replace the data URI in the `@font-face` `src`.

## License

MIT
