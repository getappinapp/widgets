# Liquid Clock

An analog clock widget with smooth second hand animation and a liquid background image.

![screenshot](./screenshot.png)

## Features

- 170x170 analog clock face with hour, minute, and second hands
- Smooth second-hand motion via `requestAnimationFrame` (discrete tick optional)
- Customizable background face image

## How it works

- `index.jsx` calculates hand angles from the current time and renders them as rotated `<div>` elements over `bg.png`; the red second hand animates fluidly via `requestAnimationFrame`.

## Customization

- **Background**: replace `bg.png` with your own clock face image.
- **Size**: change the `size` constant at the top of `index.jsx`.
- **Position on screen**: adjust the `x` / `y` / `height` / `width` exports.
- **Animation**: set `smooth = false` to switch to a discrete 1-second tick.
- **Hand styles**: edit the `HandWithPill` component props (`width`, `height`, `pillHeight`) for different hand shapes.
- **Metadata**: update `widget.json` to change the widget name and description.

## Notes

- Refreshes every second via `refreshFrequency`.

## License

MIT
