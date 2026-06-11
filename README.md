# Component Builder

Component Builder is a Vite + React + TypeScript app for building and previewing UI component configurations.

## Scripts

- `npm run dev`: start the local development server
- `npm run build`: type-check and build for production
- `npm run lint`: run ESLint
- `npm run preview`: preview the production build
- `npm run verify:list-mode-root-styles`: verify list-mode API preview keeps root component style wrapper
- `npm run prebuilt:styles:sync`: run the prebuilt styles sync action
- `npm run prebuilt:styles:hook`: watch `src/appgen-config.json` and trigger sync when `prebuilt.elements[*].styles` changes

## Prebuilt Styles Save Hook

This repo includes a save hook for `src/appgen-config.json`:

- Detects key-shape changes only under `prebuilt.elements[*].styles`.
- Triggers after save.
- Runs `npm run prebuilt:styles:sync` by default, which now runs:
  - `npm run verify:list-mode-root-styles`
  - `npm run build`

The workspace task `Prebuilt Styles Hook` in `.vscode/tasks.json` is configured to auto-start on folder open.

You can override commands via env vars:

- `PREBUILT_STYLES_HOOK_COMMAND`
- `PREBUILT_STYLES_SYNC_COMMAND`
- `PREBUILT_STYLES_REGRESSION_COMMAND`

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components

## License

This project is licensed under the MIT license. See [LICENSE](LICENSE).
