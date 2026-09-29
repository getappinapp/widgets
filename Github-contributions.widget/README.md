# GitHub Contributions

A GitHub contribution graph widget showing your yearly commit activity as a heatmap.


## Features

- Yearly contribution calendar rendered as a color-coded grid, like the GitHub profile graph
- Color intensity mapped to daily commit counts
- Auto-refresh every hour

## How it works

- `index.jsx` queries the GitHub GraphQL API for the current year's contribution data, normalizes the weeks, and renders a CSS grid of colored cells.

## Customization

- **Username**: change the `githubUsername` constant at the top of `index.jsx`.
- **Token**: set a personal access token in `githubToken` for private profile data.
- **Grid size**: adjust `width` / `height`, or change the `columns` calculation.
- **Colors**: edit the `getColor` function to customize the commit-count-to-color mapping.
- **Refresh interval**: change `refreshFrequency` (default: 1 hour).
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Requires a GitHub personal access token for API access; keep tokens out of version-controlled files.

## License

MIT
