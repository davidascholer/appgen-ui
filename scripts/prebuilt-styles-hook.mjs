import { readFile, watch } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const workspaceRoot = process.cwd();
const configPath = path.join(workspaceRoot, "src", "appgen-config.json");

const HOOK_COMMAND =
  process.env.PREBUILT_STYLES_HOOK_COMMAND?.trim() ||
  "npm run prebuilt:styles:sync";

const HOOK_DEBOUNCE_MS = Number(
  process.env.PREBUILT_STYLES_HOOK_DEBOUNCE_MS ?? 300,
);

let lastFingerprint = "";
let debounceTimer = null;
let hookRunning = false;
let rerunRequested = false;

const toStableJson = (value) => JSON.stringify(value, null, 0);

const getStylesFingerprint = (raw) => {
  const elements = raw?.prebuilt?.elements;
  if (!Array.isArray(elements)) return "";

  const normalized = elements
    .map((element) => {
      const id = typeof element?.id === "string" ? element.id : "";
      const styles =
        element?.styles &&
        typeof element.styles === "object" &&
        !Array.isArray(element.styles)
          ? Object.keys(element.styles).sort()
          : [];
      return { id, styles };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return toStableJson(normalized);
};

const readFingerprint = async () => {
  const rawText = await readFile(configPath, "utf8");
  const parsed = JSON.parse(rawText);
  return getStylesFingerprint(parsed);
};

const runHook = async () => {
  if (hookRunning) {
    rerunRequested = true;
    return;
  }

  hookRunning = true;
  const startedAt = new Date().toLocaleTimeString();
  console.log(
    `[prebuilt-styles-hook] styles changed (${startedAt}) -> ${HOOK_COMMAND}`,
  );

  const child = spawn(HOOK_COMMAND, {
    shell: true,
    stdio: "inherit",
    cwd: workspaceRoot,
    env: process.env,
  });

  await new Promise((resolve) => {
    child.on("exit", (code) => {
      if (code === 0) {
        console.log(
          "[prebuilt-styles-hook] hook command completed successfully.",
        );
      } else {
        console.error(
          `[prebuilt-styles-hook] hook command failed with exit code ${code}.`,
        );
      }
      resolve();
    });
  });

  hookRunning = false;

  if (rerunRequested) {
    rerunRequested = false;
    await runHook();
  }
};

const onConfigWrite = async () => {
  try {
    const nextFingerprint = await readFingerprint();
    if (nextFingerprint === lastFingerprint) {
      return;
    }

    lastFingerprint = nextFingerprint;
    await runHook();
  } catch (error) {
    console.error(
      "[prebuilt-styles-hook] failed to parse appgen-config.json",
      error,
    );
  }
};

const scheduleCheck = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    void onConfigWrite();
  }, HOOK_DEBOUNCE_MS);
};

const main = async () => {
  try {
    lastFingerprint = await readFingerprint();
  } catch (error) {
    console.error("[prebuilt-styles-hook] failed initial read", error);
  }

  console.log(
    "[prebuilt-styles-hook] watching src/appgen-config.json for prebuilt.elements.*.styles changes...",
  );

  const watcher = watch(configPath);
  for await (const event of watcher) {
    if (event.eventType === "change") {
      scheduleCheck();
    }
  }
};

void main();
