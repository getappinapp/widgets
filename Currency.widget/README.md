# Currency

A currency widget which shows USD-UZS now, but you can customize it to what to show.

![screenshot](./screenshot.png)

## Features

- Current USD → UZS rate display
- On-disk rate cache to reduce API calls
- Auto-refresh every 24 hours

## How it works

- `rates.sh` fetches exchange data from the configured API endpoint and caches it (`usd-rates.cache`).
- `index.jsx` exports `command` (`./rates.sh`) and renders the fetched rate in the widget UI.

## Customization

- **Currencies**: edit `rates.sh` to modify the currency pairs or the API endpoint used.
- **Refresh interval**: change `refreshFrequency` in `index.jsx` (currently 24 hours).
- **Appearance**: edit `index.jsx` to change text, layout, formatting, or styling.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Run `chmod +x ~/{your-widget-path}/Currency.widget/rates.sh` to make the shell script executable.
- Cache is stored inside the widget folder as `usd-rates.cache`.
- Keep network/API keys (if any) out of version-controlled files — use environment variables or local config for private credentials.

## License

MIT
