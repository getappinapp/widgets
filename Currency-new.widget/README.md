# Currency New

A macOS widget displaying real-time USD/UZS exchange rates from the Central Bank of Uzbekistan, featuring an interactive 11-day trend chart with hover tooltips and automatic caching.


## Features

- Current USD/UZS rate with daily percentage change
- Interactive 11-day trend chart with hover tooltips
- 6-hour on-disk cache to reduce API calls
- Auto-refresh every 24 hours

## How it works

- `rates.sh` fetches exchange rate data from the Central Bank of Uzbekistan API and caches it for 6 hours (`usd-rates.cache`).
- `index.jsx` exports `command` (`./rates.sh`) and renders the rate plus a responsive chart component with mouse-hover tooltips.

## Customization

- **Refresh interval**: modify `refreshFrequency` in `index.jsx` (currently 24 hours).
- **Cache duration**: edit the `CACHE_TTL` variable in `rates.sh` (currently 6 hours).
- **Appearance**: edit `index.jsx` to change colors, fonts, layout, or chart styling.
- **Data source**: update the API URL in `rates.sh` to fetch different currency pairs.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Run `chmod +x ~/{your-widget-path}/Currency-new.widget/rates.sh` to make the shell script executable.
- Fetches from the Central Bank of Uzbekistan's public API (no API key required).
- Network access is required for the initial fetch; cached data is used when offline.
- Cache is stored inside the widget folder as `usd-rates.cache`.

## License

MIT
