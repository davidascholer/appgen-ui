import { spawn } from "node:child_process";
import process from "node:process";

const regressionCommand =
  process.env.PREBUILT_STYLES_REGRESSION_COMMAND?.trim() ||
  "node scripts/verify-list-mode-root-styles.mjs";

const command =
  process.env.PREBUILT_STYLES_SYNC_COMMAND?.trim() || "npm run build";

const run = (nextCommand) =>
  new Promise((resolve) => {
    console.log(`[prebuilt-styles-sync] running: ${nextCommand}`);
    const child = spawn(nextCommand, {
      shell: true,
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    });

    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });

const main = async () => {
  const regressionExitCode = await run(regressionCommand);
  if (regressionExitCode !== 0) {
    process.exit(regressionExitCode);
  }

  const syncExitCode = await run(command);
  process.exit(syncExitCode);
};

void main();
