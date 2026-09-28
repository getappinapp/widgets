# Taqvim

A prayer-times widget showing daily namoz times for Tashkent in Uzbek (Latin).

![screenshot](./screenshot.png)

## Features

- Shows all six prayer times: Bomdod, Quyosh, Peshin, Asr, Shom, Xufton
- Highlights the current/next prayer time with a green badge
- Loading skeleton animation while data is being fetched
- Region name and formatted date in the top row

## How it works

- `index.jsx` exports a `command` that runs `curl` against `namoz-vaqti.uz` (`format=json&lang=lotin&period=today&region=toshkent`) and parses the JSON response into time labels with active-state detection.

## Customization

- **Region**: edit the `region=toshkent` parameter in the `command` export.
- **Language**: edit the `lang=lotin` parameter (e.g. use `kirill` for Cyrillic).
- **Refresh interval**: update `refreshFrequency` (default: `60000` ms / 1 minute).
- **Layout and labels**: edit `index.jsx` to change ordering, labels, fonts, or time formatting.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Requires network access to `namoz-vaqti.uz`; no API key needed.

## License

MIT
