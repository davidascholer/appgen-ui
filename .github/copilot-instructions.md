# Copilot Steering Rules

## Preview Action Standard

For any tab, panel, or view that includes a **Preview** section:

1. Include a `JSON` button in the preview header action area.
2. The `JSON` button must open a dialog that displays the current preview data as formatted JSON.
3. The JSON dialog must include:
   - `Copy JSON` action (with success/error toast)
   - `Download JSON` action (downloads a `.json` file)
4. Keep JSON actions colocated with the preview they represent (do not place them in unrelated editor sections).
5. Apply this rule to all new tabs/features that introduce preview UI.

## Implementation Guidance

- Follow existing dialog/button patterns already used in the app for consistency.
- Use descriptive dialog titles (for example: `Page JSON`, `Component JSON`, `Theme JSON`).
- Keep generated JSON payloads structured and human-readable (`JSON.stringify(value, null, 2)`).

## Config File Protection

- Treat `src/appgen-config.json` as read-only.
- Never write to, overwrite, format, or auto-update `src/appgen-config.json`.
- If a change appears to require modifying `src/appgen-config.json`, stop and ask the user for explicit confirmation first.

## Data Source Rules

- All component, page, navigation, theme, and element data must be sourced from `src/appgen-config.json` and/or browser local storage.
- The only runtime persistence target is browser local storage; do not write app state to any other file or storage target.
- Prebuilt pages, components, and elements must be read from `src/appgen-config.json` under `ui`.
- Non-`ui` objects in `src/appgen-config.json` define default data used when creating new pages/components/navigation/theme values.
