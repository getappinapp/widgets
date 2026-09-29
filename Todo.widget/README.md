# Todo

A minimalistic, modern to-do list for your desktop. Glassy dark card, quick-add input, one-click complete, and tasks that persist between restarts.


## Features

- Add tasks by typing and pressing **Enter** or tapping the **+** button
- Click the checkbox to mark a task done (shows a strikethrough)
- Hover a task to reveal the delete (trash) button
- Live counter in the header showing how many tasks are left
- Tasks are saved to local storage, so they survive a restart

## How it works

- `index.jsx` renders the `Todo` component with `react` state for the task list; tasks persist to local storage so they survive restarts.

## Customization

All visual styling lives in the `className` export inside `index.jsx` as plain CSS — no build step needed.

- **Accent color**: change the blue gradient in `.todo-checkbox.done` and `.todo-add-btn` (`#7aa2ff` / `#5b7fff`) to your own colors.
- **Size**: adjust `width` / `height` near the top of `index.jsx` (`350` / `295`).
- **Position on screen**: adjust `x` / `y`.
- **Blur / transparency**: tweak `backdrop-filter` and the `rgba(...)` background value on `.todo-widget`.
- **Font**: edit the `font-family` in `.todo-widget`.

## Notes

- No shell `command` is used — this widget is pure UI state, so it has no `refreshFrequency`.
- Only `react` and `lucide-react` are imported, per the widget environment's limited module set.

## License

MIT
